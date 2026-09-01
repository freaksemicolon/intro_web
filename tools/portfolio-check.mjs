import { access, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..'),specDir=path.join(root,'data','specs'),enDir=path.join(specDir,'en');
const args=new Set(process.argv.slice(2)),errors=[],warnings=[];
const parse=text=>{const match=text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);const meta={};if(match)match[1].split(/\r?\n/).forEach(line=>{const i=line.indexOf(':');if(i>0)meta[line.slice(0,i).trim()]=line.slice(i+1).trim().replace(/^['"]|['"]$/g,'')});return{meta,body:match?text.slice(match[0].length):text}};
const exists=async file=>access(file).then(()=>true).catch(()=>false);
const mdFiles=(await readdir(specDir)).filter(x=>x.endsWith('.md')&&x!=='index.md');
const records=[];

for(const file of mdFiles){
  const full=path.join(specDir,file),text=await readFile(full,'utf8'),{meta,body}=parse(text),info=await stat(full);
  for(const key of ['title','organization','category','date'])if(!meta[key])errors.push(`${file}: 필수 항목 '${key}' 누락`);
  for(const key of ['status','updated'])if(!meta[key])warnings.push(`${file}: '${key}'가 없어 기본값을 사용합니다.`);
  if(meta.image){const imagePath=path.resolve(root,meta.image.replace(/^\//,''));if(!await exists(imagePath))errors.push(`${file}: 이미지 없음 (${meta.image})`)}
  for(const match of body.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){const url=match[1].trim();if(!/^(https?:|mailto:|#)/i.test(url)){const local=path.resolve(url.startsWith('data/')?root:specDir,url);if(!await exists(local))errors.push(`${file}: 본문 링크·이미지 없음 (${url})`)}}
  if(!await exists(path.join(enDir,file)))warnings.push(`${file}: 영문 번역 누락`);
  records.push({file,full,text,meta,body,mtime:info.mtime});
}

records.sort((a,b)=>Number(b.meta.featured==='true')-Number(a.meta.featured==='true')||String(b.meta.date).localeCompare(String(a.meta.date))||a.file.localeCompare(b.file,'ko'));
if(args.has('--write')){
  for(const record of records){
    const updated=record.mtime.toISOString().slice(0,10);let text=record.text;
    const setField=(key,value)=>{const re=new RegExp(`^${key}:.*$`,'m');text=re.test(text)?text.replace(re,`${key}: ${value}`):text.replace(/^(---\s*\r?\n)/,`$1${key}: ${value}\n`)};
    setField('updated',updated);setField('status',record.meta.status||'completed');
    if(text!==record.text)await writeFile(record.full,text,'utf8');
  }
  const index=records.map(x=>`- [${x.meta.title||x.file}](${encodeURI(x.file).replace(/#/g,'%23')})`).join('\n')+'\n';
  await writeFile(path.join(specDir,'index.md'),index,'utf8');
  console.log('data/specs/index.md를 featured → date 순서로 정렬했습니다.');
}

if(args.has('--links')){
  const urls=[];for(const {file,meta,body} of records){for(const value of Object.values(meta))if(/^https?:\/\//i.test(value))urls.push([file,value]);for(const m of body.matchAll(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/g))urls.push([file,m[1]])}
  for(const [file,url] of urls){try{const response=await fetch(url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(8000)});if(!response.ok)warnings.push(`${file}: 외부 링크 HTTP ${response.status} (${url})`)}catch{warnings.push(`${file}: 외부 링크 확인 실패 (${url})`)}}
}

if(args.has('--sitemap')){
  const site=(process.env.SITE_URL||'').replace(/\/$/,'');
  if(!site)errors.push('사이트맵 생성에는 SITE_URL이 필요합니다. 예: $env:SITE_URL="https://id.github.io"');
  else{const now=new Date().toISOString().slice(0,10),xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><lastmod>${now}</lastmod></url>\n</urlset>\n`;await writeFile(path.join(root,'sitemap.xml'),xml,'utf8');await writeFile(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`,'utf8');console.log('sitemap.xml과 robots.txt를 생성했습니다.')}}

console.log(`\n검사: ${records.length}개 Markdown · 오류 ${errors.length} · 경고 ${warnings.length}`);
errors.forEach(x=>console.error(`ERROR ${x}`));warnings.forEach(x=>console.warn(`WARN  ${x}`));
process.exitCode=errors.length?1:0;
