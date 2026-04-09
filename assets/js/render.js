// Helper functions to generate HTML strings for the feed

function escapeHtml(unsafe) {
    return (unsafe || '').toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateStr) {
    if (!dateStr) return '현재';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// 1. Right Profile Panel Renderer
function updateProfilePanel(profile) {
    document.getElementById('profile-name').innerText = profile.name || 'Developer';
    document.getElementById('profile-major').innerText = `${profile.major || ''} | ${profile.mbti || ''}`;
    if (profile.profile_image) {
        const img = document.querySelector('#profile-img-container img');
        if (img) img.src = profile.profile_image;
    }

    let linksHtml = '';
    if (profile.github_url) linksHtml += `<a href="${profile.github_url}" class="profile-link" target="_blank"><i class="fab fa-github"></i> GitHub</a>`;
    linksHtml += `<a href="#/blog" class="profile-link"><i class="fas fa-book"></i> Blog</a>`;
    if (profile.notion_url) linksHtml += `<a href="${profile.notion_url}" class="profile-link" target="_blank"><i class="fas fa-book-open"></i> Notion</a>`;
    document.getElementById('profile-links').innerHTML = linksHtml;

    if (profile.github_url) {
        document.getElementById('sidebar-github-wrapper').style.display = 'block';
        document.getElementById('sidebar-github').href = profile.github_url;
    }
}
// ─── Specs Page: State & Helpers ───────────────────────────────────────────
const SPEC_CATS = ['프로젝트', '인턴십', '수상', '교육', '대외활동', '자격증'];
const SPEC_CAT_COLORS = {
    '프로젝트': '#60a5fa',
    '인턴십': '#a78bfa',
    '수상': '#fbbf24',
    '교육': '#34d399',
    '대외활동': '#f472b6',
    '자격증': '#818cf8'
};

const _ss = {          // Specs State
    data: [],          // working copy with priorities
    cats: new Set(),   // selected categories (empty = all)
    sortBy: 'priority',
    sortDir: 'asc',
    dragSrcId: null
};

function _ssFiltered() {
    if (_ss.cats.size === 0) return [..._ss.data];
    return _ss.data.filter(s => _ss.cats.has(s.category));
}

function _ssSorted(items) {
    const dir = _ss.sortDir === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => {
        if (_ss.sortBy === 'date') {
            return dir * (new Date(a.date || 0) - new Date(b.date || 0));
        }
        return dir * ((a.priority ?? 999) - (b.priority ?? 999));
    });
}

// ── Spec actions (called from inline handlers) ──
function specToggleCat(cat) {
    if (_ss.cats.has(cat)) _ss.cats.delete(cat); else _ss.cats.add(cat);
    _ssRerender(false);
}
function specSelectAll() { _ss.cats.clear(); _ssRerender(false); }
function specSetSort(by) { _ss.sortBy = by; _ssRerender(true); }
function specSetDir(dir) { _ss.sortDir = dir; _ssRerender(true); }

function _ssRerender(animate) {
    const ctrl = document.getElementById('specs-controls');
    const list = document.getElementById('specs-list-body');
    if (!ctrl || !list) return;
    ctrl.innerHTML = _buildSpecsControls();
    if (animate) {
        list.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        list.style.opacity = '0';
        list.style.transform = 'translateY(8px)';
        setTimeout(() => {
            list.innerHTML = _buildSpecsList();
            list.style.opacity = '1';
            list.style.transform = 'translateY(0)';
        }, 180);
    } else {
        list.innerHTML = _buildSpecsList();
    }
}

// ── Drag & Drop ──
function specDragStart(e, id) {
    _ss.dragSrcId = id;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (e.currentTarget) e.currentTarget.style.opacity = '0.4'; }, 10);
}
function specDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function specDragLeave(e) { }
function specDrop(e, id) {
    e.preventDefault();
    if (_ss.dragSrcId === null || _ss.dragSrcId === id) return;
    // Reorder in current sorted view then save back priorities
    const sorted = _ssSorted(_ssFiltered());
    const srcIdx = sorted.findIndex(s => s.id === _ss.dragSrcId);
    const tgtIdx = sorted.findIndex(s => s.id === id);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const [moved] = sorted.splice(srcIdx, 1);
    sorted.splice(tgtIdx, 0, moved);
    // Update priorities across ALL data based on new order of visible items
    sorted.forEach((s, i) => {
        const item = _ss.data.find(d => d.id === s.id);
        if (item) item.priority = i + 1;
    });
    // Normalize remaining items not in view
    let counter = sorted.length + 1;
    _ss.data.filter(d => !sorted.find(s => s.id === d.id)).forEach(d => { d.priority = counter++; });
    _ss.dragSrcId = null;
    _ssRerender(false);
}
function specDragEnd(e) {
    _ss.dragSrcId = null;
    document.querySelectorAll('.spec-row').forEach(r => r.style.opacity = '1');
}

function _buildSpecsControls() {
    const isAll = _ss.cats.size === 0;
    const pills = [`<button onclick="specSelectAll()" style="${_pillStyle(isAll)}">전체</button>`];
    SPEC_CATS.forEach(cat => {
        const active = _ss.cats.has(cat);
        const col = SPEC_CAT_COLORS[cat] || 'var(--accent-color)';
        pills.push(`<button onclick="specToggleCat('${cat}')" style="
            display:inline-flex;align-items:center;gap:6px;padding:7px 16px;
            border-radius:999px;font-size:0.88rem;font-weight:600;cursor:pointer;
            border:1.5px solid ${active ? col : 'var(--border-color)'};
            background:${active ? col + '22' : 'transparent'};
            color:${active ? col : 'var(--text-muted)'};
            transition:all 0.2s ease;white-space:nowrap;
        "><span style="width:7px;height:7px;border-radius:50%;background:${col};display:inline-block;"></span>${cat}</button>`);
    });
    const sortByOpts = [['priority', '기본 순서'], ['date', '날짜순']].map(([v, l]) =>
        `<option value="${v}" ${_ss.sortBy === v ? 'selected' : ''}>${l}</option>`).join('');
    const dir1 = _ss.sortBy === 'date' ? '오래된순' : '중요순';
    const dir2 = _ss.sortBy === 'date' ? '최신순' : '역순';
    return `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:20px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">${pills.join('')}</div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <select onchange="specSetSort(this.value)" style="background:var(--card-bg);color:var(--text-color);border:1px solid var(--border-color);border-radius:8px;padding:7px 12px;font-size:0.88rem;cursor:pointer;outline:none;">${sortByOpts}</select>
            <div style="display:flex;">
                <button onclick="specSetDir('asc')" style="${_sortBtnStyle(_ss.sortDir === 'asc')}border-radius:8px 0 0 8px;">${dir1}</button>
                <button onclick="specSetDir('desc')" style="${_sortBtnStyle(_ss.sortDir === 'desc')}border-radius:0 8px 8px 0;margin-left:-1px;">${dir2}</button>
            </div>
        </div>
    </div>`;
}

function _pillStyle(active) {
    return `display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:999px;font-size:0.88rem;font-weight:600;cursor:pointer;border:1.5px solid ${active ? 'var(--accent-color)' : 'var(--border-color)'};background:${active ? 'rgba(20,184,166,0.12)' : 'transparent'};color:${active ? 'var(--accent-color)' : 'var(--text-muted)'};transition:all 0.2s ease;white-space:nowrap;`;
}
function _sortBtnStyle(active) {
    return `padding:7px 12px;font-size:0.88rem;font-weight:600;cursor:pointer;border:1px solid ${active ? 'var(--accent-color)' : 'var(--border-color)'};background:${active ? 'rgba(20,184,166,0.12)' : 'transparent'};color:${active ? 'var(--accent-color)' : 'var(--text-muted)'};transition:all 0.2s ease;`;
}

function _buildSpecsList() {
    const items = _ssSorted(_ssFiltered());
    if (items.length === 0) return `
        <div style="text-align:center;color:var(--text-muted);padding:60px 20px;">
            <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:12px;opacity:0.3;"></i>
            해당 카테고리의 항목이 없습니다.
        </div>`;

    const rows = items.map((spec, idx) => {
        const col = SPEC_CAT_COLORS[spec.category] || 'var(--accent-color)';
        return `
        <div class="spec-row" data-id="${spec.id}" draggable="true"
             ondragstart="specDragStart(event,${spec.id})"
             ondragover="specDragOver(event)"
             ondrop="specDrop(event,${spec.id})"
             ondragend="specDragEnd(event)"
             style="display:grid;grid-template-columns:28px 2fr 1fr 120px 110px;align-items:center;gap:0;padding:13px 16px 13px 0;border-bottom:1px solid var(--border-color);transition:background 0.15s,opacity 0.2s;border-radius:8px;cursor:pointer;"
             onmouseover="this.style.background='var(--hover-bg)'"
             onmouseout="this.style.background='transparent'"
             onclick="if(event.target.closest('.drag-handle'))return;window.location.hash='#/specs/${spec.id}'">
            <div class="drag-handle" onclick="event.stopPropagation()" style="display:flex;align-items:center;justify-content:center;cursor:grab;color:var(--text-muted);opacity:0.25;padding-left:8px;transition:opacity 0.2s;"
                 onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='0.25'">
                <i class="fas fa-grip-vertical" style="font-size:0.8rem;"></i>
            </div>
            <div style="display:flex;align-items:center;gap:10px;overflow:hidden;padding-right:12px;">
                <span style="min-width:7px;width:7px;height:7px;border-radius:50%;background:${col};flex-shrink:0;"></span>
                <span style="font-size:0.95rem;font-weight:600;color:var(--text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(spec.title)}</span>
            </div>
            <div style="font-size:0.88rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:12px;">${escapeHtml(spec.organization)}</div>
            <div><span style="font-size:0.78rem;font-weight:600;padding:4px 10px;border-radius:999px;background:${col}22;color:${col};border:1px solid ${col}44;">${escapeHtml(spec.category)}</span></div>
            <div style="font-size:0.83rem;color:var(--text-muted);">${formatDate(spec.date)}</div>
        </div>`;
    }).join('');

    return `
    <div style="display:grid;grid-template-columns:28px 2fr 1fr 120px 110px;gap:0;padding:8px 16px 8px 0;font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;border-bottom:2px solid var(--border-color);margin-bottom:4px;">
        <span></span><span>제목</span><span>소속/기관</span><span>카테고리</span><span>날짜</span>
    </div>
    ${rows}`;
}

// --- Blog Page State ---
const BLOG_CATS = ['기술', '소식'];
const BLOG_CAT_COLORS = { '기술': '#60a5fa', '소식': '#f472b6' };
const _bs = { selectedCat: null };

function blogSetCat(cat) {
    _bs.selectedCat = _bs.selectedCat === cat ? null : cat;
    _bsRerender();
}

function _bsRerender() {
    const ctrl = document.getElementById('blog-controls');
    const list = document.getElementById('blog-list');
    if (!ctrl || !list) return;
    ctrl.innerHTML = _buildBlogControls();
    list.style.opacity = '0';
    list.style.transform = 'translateY(8px)';
    setTimeout(() => {
        list.innerHTML = _buildBlogList();
        list.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        list.style.opacity = '1';
        list.style.transform = 'translateY(0)';
    }, 150);
}

function _buildBlogControls() {
    const pills = [`<button onclick="blogSetCat(null)" style="${_blogPillStyle(_bs.selectedCat === null)}">전체</button>`];
    BLOG_CATS.forEach(cat => {
        const col = BLOG_CAT_COLORS[cat] || 'var(--accent-color)';
        const active = _bs.selectedCat === cat;
        pills.push(`<button onclick="blogSetCat('${cat}')" style="
            display:inline-flex;align-items:center;gap:7px;padding:7px 18px;
            border-radius:999px;font-size:0.88rem;font-weight:600;cursor:pointer;
            border:1.5px solid ${active ? col : 'var(--border-color)'};
            background:${active ? col + '22' : 'transparent'};
            color:${active ? col : 'var(--text-muted)'};
            transition:all 0.2s ease;white-space:nowrap;
        "><span style="width:7px;height:7px;border-radius:50%;background:${col};display:inline-block;"></span>${cat}</button>`);
    });
    return `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:24px;">${pills.join('')}</div>`;
}

function _blogPillStyle(active) {
    return `display:inline-flex;align-items:center;gap:6px;padding:7px 18px;border-radius:999px;font-size:0.88rem;font-weight:600;cursor:pointer;border:1.5px solid ${active ? 'var(--accent-color)' : 'var(--border-color)'};background:${active ? 'rgba(20,184,166,0.12)' : 'transparent'};color:${active ? 'var(--accent-color)' : 'var(--text-muted)'};transition:all 0.2s ease;white-space:nowrap;`;
}

let _blogAllPosts = [];
let _blogProfile = {};

function _buildBlogList() {
    const filtered = _bs.selectedCat
        ? _blogAllPosts.filter(p => p.category === _bs.selectedCat)
        : _blogAllPosts;

    if (filtered.length === 0) {
        return `<div style="text-align:center;color:var(--text-muted);padding:60px 20px;">
            <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:12px;opacity:0.3;"></i>
            해당 카테고리의 글이 없습니다.
        </div>`;
    }

    return filtered.map((post) => {
        const col = BLOG_CAT_COLORS[post.category] || 'var(--accent-color)';
        const tagsStr = (post.tags || []).map(t => `#${t}`).join(' ');
        return `
        <article class="card feed-card" style="display:flex;flex-direction:column;">
            <div class="feed-header">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;border-radius:50%;padding:2px;border:2px solid ${col};">
                        <div style="width:100%;height:100%;border-radius:50%;background:var(--card-bg);display:flex;align-items:center;justify-content:center;">
                            <i class="fas fa-${post.category === '기술' ? 'code' : 'newspaper'}" style="font-size:0.8rem;color:${col};"></i>
                        </div>
                    </div>
                    <div>
                        <div style="font-weight:700;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
                            ${escapeHtml(_blogProfile.name || 'Dev.log')}
                            <span style="font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:999px;background:${col}22;color:${col};border:1px solid ${col}44;">${escapeHtml(post.category || '')}</span>
                        </div>
                        <div style="font-size:0.8rem;color:var(--text-muted);">${formatDate(post.created_at)}</div>
                    </div>
                </div>
                <i class="fas fa-ellipsis-h" style="color:var(--text-muted);cursor:pointer;"></i>
            </div>
            <div class="feed-content">
                <div style="margin-bottom:12px;color:var(--accent-color);font-size:0.85rem;font-weight:600;">${escapeHtml(tagsStr)}</div>
                <h3 style="font-size:1.4rem;font-weight:800;margin-bottom:12px;letter-spacing:-0.02em;">
                    <a href="#/blog/${post.slug}">${escapeHtml(post.title)}</a>
                </h3>
                <p style="font-size:1rem;color:var(--text-color);margin-bottom:20px;line-height:1.6;">${escapeHtml(post.summary)}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:16px;">
                    <div style="display:flex;gap:16px;font-size:1.3rem;color:var(--text-color);">
                        <i class="far fa-heart" style="cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='${col}'" onmouseout="this.style.color='var(--text-color)'"></i>
                        <i class="far fa-comment" style="cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='${col}'" onmouseout="this.style.color='var(--text-color)'"></i>
                        <i class="far fa-paper-plane" style="cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='${col}'" onmouseout="this.style.color='var(--text-color)'"></i>
                    </div>
                    <a href="#/blog/${post.slug}" style="font-size:0.9rem;color:var(--text-muted);font-weight:500;">자세히 보기</a>
                </div>
            </div>
        </article>`;
    }).join('');
}

// ──────────────────────────────────────

// 2. DOM Renderers combining Premium & Instagram Vibe
const Renderer = {
    Home: (profile, specs, posts) => {
        let html = `
        <section class="hero-section animate-fade-up">
            <h1 class="hero-title">
                탐구하며<br>배우고 기록하는,<br> <span class="highlight">${escapeHtml(profile.name)}</span>입니다.
            </h1>
            <p class="hero-subtitle">
                문제 해결과 사용자 중심 웹 경험에 관심이 많은 학생입니다. 
                <br>다양한 개발 스택을 경험하며, 최근에는 컴퓨터 그래픽스 분야에도 흥미를 가지고 있습니다.
            </p>
            <div style="display:flex; gap:12px; margin-top: 10px;">
                <a href="#/about" class="btn btn-primary"><i class="fas fa-user-astronaut"></i> 더 알아보기</a>
                <a href="#/contact" class="btn"><i class="fas fa-paper-plane"></i> 연락하기</a>
            </div>
        </section>

        <!-- Featured Specs -->
        <div class="animate-fade-up delay-100" style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; padding: 0 5px;">
                <div>
                    <h2 style="font-size: 1.3rem; font-weight: 700; letter-spacing: -0.02em;">최근 활동 이력</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top:2px;">프로젝트 및 성과 요약</p>
                </div>
                <a href="#/specs" style="font-size: 0.9rem; font-weight: 600; color: var(--accent-color);">전체 스펙 보기 <i class="fas fa-arrow-right" style="font-size:0.8rem; margin-left:3px;"></i></a>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        `;

        specs.slice(0, 2).forEach((spec, idx) => {
            const col = SPEC_CAT_COLORS[spec.category] || 'var(--accent-color)';
            html += `
            <article class="card feed-card" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-size:0.78rem;font-weight:700;padding:4px 10px;border-radius:999px;background:${col}22;color:${col};border:1px solid ${col}44;">${escapeHtml(spec.category)}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="far fa-calendar-alt"></i> ${formatDate(spec.date || spec.start_date)}</span>
                </div>
                <h3 style="font-size: 1.3rem; font-weight:700; margin-bottom: 6px;"><a href="#/specs/${spec.id}">${escapeHtml(spec.title)}</a></h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 12px; font-weight: 500;">@ ${escapeHtml(spec.organization)}</p>
                <p style="font-size: 0.95rem; color: var(--text-color); line-height: 1.5; margin-bottom: 15px;">${escapeHtml(spec.short_description)}</p>
                <a href="#/specs/${spec.id}" style="font-size: 0.9rem; color: var(--accent-color); font-weight: 600;">Keep reading →</a>
            </article>`;
        });

        html += `
            </div>
        </div>

        <!-- Latest Posts -->
        <div class="animate-fade-up delay-200" style="margin-top: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; padding: 0 5px;">
                <div>
                    <h2 style="font-size: 1.3rem; font-weight: 700; letter-spacing: -0.02em;">최근 개발 블로그</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top:2px;">Dev Log</p>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 20px;">
        `;

        posts.slice(0, 3).forEach(post => {
            html += `
            <article class="card feed-card" style="display:flex; flex-direction:column;">
                <div class="feed-header">
                    <div style="display:flex; align-items:center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-color); border: 1px solid var(--border-color); display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-terminal" style="font-size: 0.8rem; color: var(--text-muted);"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600; font-size:0.95rem;">Dev.log</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(post.created_at)}</div>
                        </div>
                    </div>
                </div>
                <div class="feed-content">
                    <h3 class="feed-title"><a href="#/blog/${post.slug}">${escapeHtml(post.title)}</a></h3>
                    <p style="font-size: 1rem; color: var(--text-color); margin-bottom: 15px; line-height: 1.6;">${escapeHtml(post.summary)}</p>
                    <div style="font-size: 0.85rem; color: var(--accent-color); font-weight: 500;">
                        ${(post.tags || []).map(t => `#${t}`).join(' ')}
                    </div>
                </div>
            </article>`;
        });

        html += `</div></div>`;
        return html;
    },

    About: (profile) => {
        return `
        <div class="animate-fade-up" style="margin-bottom: 10px; padding: 10px 5px;">
            <h1 style="font-size: 1.8rem; font-weight: 800; letter-spacing:-0.03em;">Profile</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">About Me</p>
        </div>
        
        <article class="card animate-fade-up delay-100">
            <div style="display: flex; gap: 35px; flex-wrap: wrap; align-items: center;">
                <div style="width: 140px; height: 140px; border-radius: 50%; background: transparent; border: 2px solid var(--accent-color); flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 5px;">
                    <img src="${profile.profile_image || 'data/face.jpg'}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center;">
                </div>
                <div style="flex: 1; min-width: 250px;">
                    <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 8px; letter-spacing:-0.03em;">${escapeHtml(profile.name)}</h2>
                    <p style="font-size: 1.05rem; color: var(--accent-color); font-weight: 600; margin-bottom: 16px;">${escapeHtml(profile.major)}</p>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap:wrap;">
                        <span class="badge"> MBTI: ${escapeHtml(profile.mbti)}</span>
                        <span class="badge"><i class="fas fa-envelope"></i>&nbsp;&nbsp;&nbsp;${escapeHtml(profile.email)}</span>
                    </div>
                </div>
            </div>
            <div style="margin-top: 30px; font-size: 1.05rem; line-height: 1.8; color: var(--text-color); border-top: 1px solid var(--border-color); padding-top: 25px;">
                ${escapeHtml(profile.about_text).replace(/\n/g, '<br>')}
            </div>
        </article>
        
        <article class="card animate-fade-up delay-200" style="margin-top: 24px;">
            <h3 style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; font-size: 1.4rem;">
                <i class="fas fa-graduation-cap" style="color: var(--accent-color);"></i> Education
            </h3>
            <div style="position:relative; margin-left:15px; border-left: 2px solid rgba(20, 184, 166, 0.2); padding-left: 25px; white-space: pre-wrap; line-height: 2.2; font-size: 1rem;">${escapeHtml(profile.education_text)}
            </div>
        </article>
        `;
    },

    Specs: (specs) => {
        _ss.data = specs.map((s, i) => ({ ...s, date: s.date || s.start_date, priority: i + 1 }));
        _ss.cats = new Set();
        _ss.sortBy = 'priority';
        _ss.sortDir = 'asc';
        _ss.dragSrcId = null;

        return `
        <div class="animate-fade-up" style="margin-bottom: 20px; padding: 10px 5px;">
            <h1 style="font-size: 1.8rem; font-weight: 800; letter-spacing:-0.03em;">Specs</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">경험과 성과 기록의 아카이브</p>
        </div>

        <div class="card animate-fade-up delay-100" style="padding: 24px 28px;">
            <div id="specs-controls">${_buildSpecsControls()}</div>
            <div id="specs-list-body" style="transition: opacity 0.2s ease, transform 0.2s ease;">${_buildSpecsList()}</div>
        </div>
        `;
    },

    SpecDetail: (spec, markdownHtml) => {
        const col = SPEC_CAT_COLORS[spec.category] || 'var(--accent-color)';
        return `
        <div class="animate-fade-up" style="margin-bottom: 24px;">
            <a href="#/specs" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.95rem; color: var(--text-muted); transition: color 0.2s;"
               onmouseover="this.style.color='var(--accent-color)'" onmouseout="this.style.color='var(--text-muted)'">
                <i class="fas fa-arrow-left"></i> 스펙 목록으로
            </a>
        </div>

        <article class="card animate-fade-up delay-100" style="padding: 0; overflow: hidden; margin-bottom: 60px;">
            <!-- Notion-style page header -->
            <div style="padding: 60px 40px 40px; border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.015);">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
                    <span style="font-size:0.8rem;font-weight:700;padding:6px 14px;border-radius:999px;background:${col}22;color:${col};border:1px solid ${col}44;">${escapeHtml(spec.category)}</span>
                    <span style="font-size:0.9rem; color:var(--text-muted); font-weight: 500;">${formatDate(spec.date)}</span>
                </div>
                <h1 style="font-size: 2.8rem; font-weight: 800; letter-spacing:-0.04em; margin-bottom: 24px; line-height:1.2; color: var(--text-color);">${escapeHtml(spec.title)}</h1>
                <div style="display:flex; align-items:center; gap:16px; color:var(--text-muted); font-size:1rem; font-weight: 500;">
                    <i class="fas fa-building" style="color:var(--accent-color); font-size: 1.1rem;"></i>
                    <span>${escapeHtml(spec.organization)}</span>
                </div>
            </div>

            <!-- Feature Image -->
            ${spec.image ? `
            <div class="feature-image-container">
                <img src="${spec.image}" alt="${escapeHtml(spec.title)}">
            </div>` : ''}

            <!-- Content body -->
            <div class="feed-content" style="padding: 40px;">
                <div class="markdown-content">
                    ${markdownHtml}
                </div>

                ${spec.link ? `
                <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid var(--border-color); text-align: center;">
                    <a href="${spec.link}" target="_blank" class="btn btn-primary" style="padding: 14px 32px;"><i class="fas fa-external-link-alt"></i> 프로젝트 상세 보기</a>
                </div>` : ''}
            </div>
        </article>
        `;
    },



    Blog: (posts, profile) => {
        _blogAllPosts = posts;
        _blogProfile = profile;
        _bs.selectedCat = null;

        return `
        <div class="animate-fade-up" style="margin-bottom: 15px; padding: 10px 5px;">
            <h1 style="font-size: 1.8rem; font-weight: 800; letter-spacing:-0.03em;">Tech Blog</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">개발 인사이트 및 일상 소식 아카이브</p>
        </div>

        <div class="animate-fade-up delay-100">
            <div id="blog-controls">${_buildBlogControls()}</div>
            <div id="blog-list" style="display:flex;flex-direction:column;gap:24px;transition:opacity 0.2s ease,transform 0.2s ease;">
                ${_buildBlogList()}
            </div>
        </div>
        `;
    },

    PostDetail: (post, markdownHtml, profile) => {
        let tagsStr = (post.tags || []).map(t => `#${t}`).join(' ');
        const col = BLOG_CAT_COLORS[post.category] || 'var(--accent-color)';
        return `
        <div class="animate-fade-up" style="margin-bottom: 24px;">
            <a href="#/blog" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.95rem; color: var(--text-muted); transition: color 0.2s;"
               onmouseover="this.style.color='var(--accent-color)'" onmouseout="this.style.color='var(--text-muted)'">
                <i class="fas fa-arrow-left"></i> 블로그 목록으로
            </a>
        </div>
        
        <article class="card feed-card animate-fade-up delay-100" style="overflow: hidden; margin-bottom: 60px;">
            <div class="feed-header" style="padding: 40px 40px 30px; border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.015);">
                 <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; padding:3px; border: 2px solid var(--accent-color);">
                        <div style="width:100%; height:100%; border-radius:50%; background:var(--card-bg); display:flex; align-items:center; justify-content:center; overflow: hidden;">
                            <img src="data/face.jpg" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.15rem; display: flex; align-items: center; gap: 10px;">
                            ${escapeHtml(profile.name || "JangSW")}
                            <span style="font-size:0.75rem;font-weight:700;padding:3px 10px;border-radius:999px;background:${col}22;color:${col};border:1px solid ${col}44;">${escapeHtml(post.category || '')}</span>
                        </div>
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin-top:4px; font-weight: 500;">${formatDate(post.created_at)}</div>
                    </div>
                </div>
            </div>

            <!-- Feature Image -->
            ${post.image ? `
            <div class="feature-image-container">
                <img src="${post.image}" alt="${escapeHtml(post.title)}">
            </div>` : ''}
            
            <div class="feed-content" style="padding: 40px;">
                <div style="margin-bottom: 30px; color: var(--accent-color); font-weight:600; font-size: 1.1rem; letter-spacing: 0.05em;">
                    ${escapeHtml(tagsStr)}
                </div>
                <h1 style="font-size: 2.8rem; font-weight: 800; margin-bottom: 40px; letter-spacing:-0.04em; line-height: 1.2;">${escapeHtml(post.title)}</h1>
                
                <div class="markdown-content">
                    ${markdownHtml}
                </div>
            </div>
        </article>
        `;
    },

    Contact: (profile) => {
        return `
        <div class="animate-fade-up" style="margin-bottom: 15px; padding: 10px 5px;">
            <h1 style="font-size: 1.8rem; font-weight: 800; letter-spacing:-0.03em;">Contact</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">언제든 새로운 기술과 협업 이야기를 환영합니다!</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 24px;">
            <article class="card animate-fade-up delay-100" style="display: flex; align-items: center; gap: 25px; padding: 30px;">
                <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(20, 184, 166, 0.1); color: var(--accent-color); display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                    <i class="fas fa-paper-plane"></i>
                </div>
                <div>
                    <div style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 6px;">Direct Email</div>
                    <a href="mailto:${escapeHtml(profile.email)}" style="font-size: 1.4rem; font-weight: 700; color: var(--text-color);">${escapeHtml(profile.email)}</a>
                </div>
            </article>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
                ${profile.github_url ? `
                <a href="${profile.github_url}" target="_blank" class="card animate-fade-up delay-200" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; padding: 40px; text-align:center;">
                    <i class="fab fa-github" style="font-size: 3.5rem; color: var(--text-color);"></i>
                    <span style="font-weight: 700; font-size: 1.1rem; margin-top:10px;">GitHub</span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">프로젝트 & 소스코드</span>
                </a>` : ''}
                
                <a href="#/blog" class="card animate-fade-up delay-300" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; padding: 40px; text-align:center;">
                    <i class="fas fa-book" style="font-size: 3.5rem; color: var(--text-color);"></i>
                    <span style="font-weight: 700; font-size: 1.1rem; margin-top:10px;">Blog</span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">탐구와 학습의 기록</span>
                </a>
                
                ${profile.notion_url ? `
                <a href="${profile.notion_url}" target="_blank" class="card animate-fade-up delay-400" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; padding: 40px; text-align:center;">
                    <i class="fas fa-book-open" style="font-size: 3.5rem; color: var(--text-color);"></i>
                    <span style="font-weight: 700; font-size: 1.1rem; margin-top:10px;">Notion</span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">상세 이력서 보기</span>
                </a>` : ''}
            </div>
        </div>
        `;
    }
};
