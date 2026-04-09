// Global State
const appData = {
  profile: null,
  specs: [],
  blog: []
};

// Theme Logic
function updateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme');
  const iconClass = theme === 'dark' ? 'fa-sun' : 'fa-moon';

  document.querySelectorAll('#theme-toggle i, #theme-toggle-mobile i').forEach(icon => {
    icon.className = `fas ${iconClass}`;
  });
}

function toggleTheme(e) {
  if (e) e.preventDefault();

  const theme = document.documentElement.getAttribute('data-theme');
  const newTheme = theme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon();
}

// Utilities
function parseFrontmatter(text) {
  const result = { metadata: {}, body: text };

  if (text.startsWith('---')) {
    const parts = text.split('---');

    if (parts.length >= 3) {
      const header = parts[1];
      result.body = parts.slice(2).join('---').trim();

      header.split('\n').forEach(line => {
        if (line.includes(':')) {
          const [key, ...valueParts] = line.split(':');
          const value = valueParts.join(':').trim().replace(/^["'](.*)["']$/, '$1');
          result.metadata[key.trim()] = value;
        }
      });
    }
  }

  return result;
}

// Data Loading
async function initializeApp() {
  try {
    // Load Profile
    appData.profile = window.PROFILE_DATA;

    // Load Specs Index
    const specsIdxRes = await fetch('data/specs/index.md');
    if (specsIdxRes.ok) {
      const specsIdxText = await specsIdxRes.text();
      const specFiles = Array.from(specsIdxText.matchAll(/\[(.*?)\]\((.*?)\)/g)).map(m => m[2]);

      const specPromises = specFiles.map(async (file) => {
        const res = await fetch(`data/specs/${file}`);

        if (res.ok) {
          const text = await res.text();
          const { metadata, body } = parseFrontmatter(text);

          return {
            id: decodeURIComponent(file), // 핵심 수정
            file: file, // 원본 파일명 보관
            title: metadata.title || decodeURIComponent(file),
            organization: metadata.organization || '',
            category: metadata.category || '기타',
            date: metadata.date || '',
            image: metadata.image || '',
            link: metadata.link || '',
            short_description: metadata.short_description || '',
            description: body
          };
        }

        return null;
      });

      appData.specs = (await Promise.all(specPromises)).filter(s => s !== null);
    }

    // Load Blog Index
    const blogIdxRes = await fetch('data/posts/index.md');
    if (blogIdxRes.ok) {
      const blogIdxText = await blogIdxRes.text();
      const blogFiles = Array.from(blogIdxText.matchAll(/\[(.*?)\]\((.*?)\)/g)).map(m => m[2]);

      const blogPromises = blogFiles.map(async (file) => {
        const res = await fetch(`data/posts/${file}`);

        if (res.ok) {
          const text = await res.text();
          const { metadata, body } = parseFrontmatter(text);

          return {
            id: decodeURIComponent(file),
            slug: decodeURIComponent(file),
            file: file,
            title: metadata.title || decodeURIComponent(file),
            created_at: metadata.date || '',
            category: metadata.category || '일반',
            tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [],
            summary: metadata.summary || '',
            content: body,
            image: metadata.image || ''
          };
        }

        return null;
      });

      appData.blog = (await Promise.all(blogPromises)).filter(b => b !== null);
    }

    updateProfilePanel(appData.profile);

    window.addEventListener('hashchange', router);
    router();

    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon();

    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleMobileBtn = document.getElementById('theme-toggle-mobile');

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    if (themeToggleMobileBtn) themeToggleMobileBtn.addEventListener('click', toggleTheme);

  } catch (e) {
    console.error('Initialization error:', e);

    const feed = document.getElementById('feed-content');
    if (feed) {
      feed.innerHTML = `
        <div style="padding: 24px;">
          <h2>시스템 초기화 중 오류가 발생했습니다.</h2>
          <p>브라우저 개발자도구(F12) → Console 탭에서 오류를 확인해 주세요.</p>
        </div>
      `;
    }
  }
}

// Router Logic
async function router() {
  const hash = window.location.hash || '#/';
  const content = document.getElementById('feed-content');

  if (!content) return;

  window.scrollTo(0, 0);

  if (hash === '#/' || hash === '#' || hash === '') {
    content.innerHTML = Renderer.Home(appData.profile, appData.specs, appData.blog);

  } else if (hash === '#/about') {
    content.innerHTML = Renderer.About(appData.profile);

  } else if (hash.startsWith('#/specs')) {
    const pathParts = hash.split('?')[0].split('/');

    if (pathParts.length === 3 && pathParts[2]) {
      const id = decodeURIComponent(pathParts[2]);
      const spec = appData.specs.find(s => s.id === id);

      if (spec) {
        const htmlContent = marked.parse(spec.description || '');
        content.innerHTML = Renderer.SpecDetail(spec, htmlContent);

        if (window.hljs) hljs.highlightAll();
      } else {
        content.innerHTML = `<div style="padding:24px;">스펙을 찾을 수 없습니다.</div>`;
      }
    } else {
      content.innerHTML = Renderer.Specs(appData.specs);
    }

  } else if (hash.startsWith('#/blog')) {
    const pathParts = hash.split('?')[0].split('/');

    if (pathParts.length === 3 && pathParts[2]) {
      const slug = decodeURIComponent(pathParts[2]);
      const post = appData.blog.find(p => p.slug === slug);

      if (post) {
        const htmlContent = marked.parse(post.content || '');
        content.innerHTML = Renderer.PostDetail(post, htmlContent, appData.profile);

        if (window.hljs) hljs.highlightAll();
      } else {
        content.innerHTML = `<div style="padding:24px;">포스트를 찾을 수 없습니다.</div>`;
      }
    } else {
      content.innerHTML = Renderer.Blog(appData.blog, appData.profile);
    }

  } else if (hash === '#/contact') {
    content.innerHTML = Renderer.Contact(appData.profile);

  } else {
    content.innerHTML = `<div style="padding:24px;"><h2>404 - Not Found</h2></div>`;
  }
}

// Start
document.addEventListener('DOMContentLoaded', initializeApp);
