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
    
    // Split major and mbti into cleaner structure
    const majorEl = document.getElementById('profile-major');
    majorEl.style.display = 'flex';
    majorEl.style.flexDirection = 'column';
    majorEl.style.gap = '4px';
    majorEl.style.color = 'var(--accent-color)';
    majorEl.style.fontWeight = '600';
    majorEl.style.fontSize = '0.9rem';
    majorEl.innerHTML = `
        <span>${profile.major || ''}</span>
        <span style="opacity: 0.7; font-size: 0.75rem; font-weight: 500; margin-top: 2px;">${profile.mbti || ''}</span>
    `;

    if (profile.profile_image) {
        const img = document.querySelector('#profile-img-container img');
        if (img) img.src = profile.profile_image;
    }

    let linksHtml = '';
    // Use consistent spacing and larger touch area for mobile
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
function specToggleCat(cat, isSingle = false) {
    if (isSingle) {
        _ss.cats.clear();
        if (cat !== 'all') _ss.cats.add(cat);
    } else {
        if (_ss.cats.has(cat)) _ss.cats.delete(cat);
        else _ss.cats.add(cat);
    }
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
    
    // --- 🖥️ Desktop UI: Pills & Separate Sort ---
    const pills = [`<button onclick="specSelectAll()" style="${_pillStyle(isAll)}">전체</button>`];
    SPEC_CATS.forEach(cat => {
        const active = _ss.cats.has(cat);
        const col = SPEC_CAT_COLORS[cat] || 'var(--accent-color)';
        pills.push(`<button onclick="specToggleCat('${cat}')" style="
            display:inline-flex;align-items:center;gap:6px;padding:7px 16px;
            border-radius:999px;font-size:0.85rem;font-weight:600;cursor:pointer;
            border:1.5px solid ${active ? col : 'var(--border-color)'};
            background:${active ? col + '22' : 'transparent'};
            color:${active ? col : 'var(--text-muted)'};
            transition:all 0.2s ease;white-space:nowrap;
        "><span style="width:7px;height:7px;border-radius:50%;background:${col};display:inline-block;"></span>${cat}</button>`);
    });

    const sortByOptsDesktop = [['priority', '기본 순서'], ['date', '날짜순']].map(([v, l]) =>
        `<option value="${v}" ${_ss.sortBy === v ? 'selected' : ''}>${l}</option>`).join('');
    
    const dir1 = _ss.sortBy === 'date' ? '오래된순' : '중요순';
    const dir2 = _ss.sortBy === 'date' ? '최신순' : '역순';

    const desktopUI = `
    <div class="desktop-only" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom: 24px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
            ${pills.join('')}
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            <select onchange="specSetSort(this.value)" class="compact-select" style="height:38px; padding:0 32px 0 12px; font-size:0.88rem;">
                ${sortByOptsDesktop}
            </select>
            <div style="display:flex;">
                <button onclick="specSetDir('asc')" style="${_sortBtnStyle(_ss.sortDir === 'asc')} border-radius:8px 0 0 8px; padding: 6px 12px;">${dir1}</button>
                <button onclick="specSetDir('desc')" style="${_sortBtnStyle(_ss.sortDir === 'desc')} border-radius:0 8px 8px 0; margin-left:-1px; padding: 6px 12px;">${dir2}</button>
            </div>
        </div>
    </div>`;

    // --- 📱 Mobile UI: Compact Side-by-Side Dropdowns ---
    const catOpts = [`<option value="all" ${isAll ? 'selected' : ''}>카테고리: 전체</option>`];
    SPEC_CATS.forEach(cat => {
        catOpts.push(`<option value="${cat}" ${_ss.cats.has(cat) ? 'selected' : ''}>${cat}</option>`);
    });

    // Unify Sort Type + Direction for cleaner Mobile UI
    const mobileSortVal = `${_ss.sortBy}_${_ss.sortDir}`;
    const sortOptsMobile = [
        { v: 'priority_asc', l: '기본 순서 (중요순)' },
        { v: 'priority_desc', l: '기본 순서 (역순)' },
        { v: 'date_desc', l: '날짜순 (최신순)' },
        { v: 'date_asc', l: '날짜순 (오래된순)' }
    ].map(opt => `<option value="${opt.v}" ${mobileSortVal === opt.v ? 'selected' : ''}>${opt.l}</option>`).join('');

    const mobileUI = `
    <div class="mobile-only flex" style="gap:10px; margin-bottom: 20px; width:100%;">
        <select class="compact-select" onchange="this.value === 'all' ? specSelectAll() : specToggleCat(this.value, true)" style="flex:1.2; min-width:0;">
            ${catOpts.join('')}
        </select>
        <select class="compact-select" onchange="specSetMobileSort(this.value)" style="flex:1; min-width:0;">
            ${sortOptsMobile}
        </select>
    </div>`;

    return desktopUI + mobileUI;
}

function specSetMobileSort(val) {
    const [by, dir] = val.split('_');
    _ss.sortBy = by;
    _ss.sortDir = dir;
    _ssRerender(true);
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
    <div class="spec-header">
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
            <div class="feed-header" style="padding: 24px 32px;">
                <div style="display:flex;align-items:center;gap:16px;">
                    <div style="width:44px;height:44px;border-radius:50%;padding:2px;border:2px solid ${col};">
                        <div style="width:100%;height:100%;border-radius:50%;background:var(--card-bg);display:flex;align-items:center;justify-content:center;">
                            <i class="fas fa-${post.category === '기술' ? 'code' : 'newspaper'}" style="font-size:0.9rem;color:${col};"></i>
                        </div>
                    </div>
                    <div>
                        <div style="font-weight:700;font-size:1rem;display:flex;align-items:center;gap:8px;">
                            ${escapeHtml(_blogProfile.name || 'Dev.log')}
                            <span style="font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:999px;background:${col}22;color:${col};border:1px solid ${col}44;">${escapeHtml(post.category || '')}</span>
                        </div>
                        <div style="font-size:0.85rem;color:var(--text-muted);font-weight:500;">${formatDate(post.created_at)}</div>
                    </div>
                </div>
                <i class="fas fa-ellipsis-h" style="color:var(--text-muted);cursor:pointer;padding: 8px;"></i>
            </div>
            <div class="feed-content" style="padding: 32px 40px 40px;">
                <div style="margin-bottom:16px;color:var(--accent-color);font-size:0.9rem;font-weight:600;letter-spacing: 0.02em;">${escapeHtml(tagsStr)}</div>
                <h3 style="font-size:1.6rem;font-weight:800;margin-bottom:16px;letter-spacing:-0.03em;line-height:1.3;">
                    <a href="#/blog/${post.slug}">${escapeHtml(post.title)}</a>
                </h3>
                <p style="font-size:1.05rem;color:var(--text-color);margin-bottom:32px;line-height:1.7;">${escapeHtml(post.summary)}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:24px;">
                    <div style="display:flex;gap:20px;font-size:1.4rem;color:var(--text-color);">
                        <i class="far fa-heart" style="cursor:pointer;transition:all 0.2s;" onmouseover="this.style.color='${col}';this.style.transform='scale(1.1)'" onmouseout="this.style.color='var(--text-color)';this.style.transform='scale(1)'"></i>
                        <i class="far fa-comment" style="cursor:pointer;transition:all 0.2s;" onmouseover="this.style.color='${col}';this.style.transform='scale(1.1)'" onmouseout="this.style.color='var(--text-color)';this.style.transform='scale(1)'"></i>
                        <i class="far fa-paper-plane" style="cursor:pointer;transition:all 0.2s;" onmouseover="this.style.color='${col}';this.style.transform='scale(1.1)'" onmouseout="this.style.color='var(--text-color)';this.style.transform='scale(1)'"></i>
                    </div>
                    <a href="#/blog/${post.slug}" style="font-size:0.95rem;color:var(--text-muted);font-weight:600;padding: 12px 16px;margin-right:-8px;">자세히 보기</a>
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
        <section class="hero-section animate-fade-up" style="padding: 40px 0; gap: 24px;">
            <h1 class="hero-title" style="line-height: 1.2; letter-spacing: var(--ls-tight);">
                탐구하며<br>배우고 기록하는,<br> <span class="highlight">${escapeHtml(profile.name)}</span>입니다.
            </h1>
            <p class="hero-subtitle" style="font-size: 1.05rem; line-height: 1.7; max-width: 580px; color: var(--text-muted);">
                문제 해결과 사용자 중심 웹 경험에 관심이 많은 학생입니다. 
                다양한 개발 스택을 경험하며, 최근에는 컴퓨터 그래픽스 분야에도 흥미를 가지고 있습니다.
            </p>
            <div style="display:flex; flex-wrap: wrap; gap:12px; margin-top: 8px;">
                <a href="#/about" class="btn btn-primary" style="padding: 14px 28px; font-size: 0.95rem;"><i class="fas fa-user-astronaut"></i> 더 알아보기</a>
                <a href="#/contact" class="btn" style="padding: 14px 28px; font-size: 0.95rem;"><i class="fas fa-paper-plane"></i> 연락하기</a>
            </div>
        </section>

        <!-- Featured Specs -->
        <div class="animate-fade-up delay-100" style="margin-top: 32px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; padding: 0 4px;">
                <div>
                    <h2 style="font-size: 1.25rem; font-weight: 800; letter-spacing: var(--ls-tight);">최근 활동</h2>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-top:2px;">Experience Summary</p>
                </div>
                <a href="#/specs" style="font-size: 0.88rem; font-weight: 600; color: var(--accent-color);">전체 보기 <i class="fas fa-arrow-right" style="font-size:0.75rem; margin-left:4px;"></i></a>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
        `;

        specs.slice(0, 2).forEach((spec, idx) => {
            const col = SPEC_CAT_COLORS[spec.category] || 'var(--accent-color)';
            html += `
            <article class="card feed-card" style="padding: 32px; display: flex; flex-direction: column; gap: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size:0.7rem;font-weight:700;padding:4px 10px;border-radius:999px;background:${col}22;color:${col};border:1px solid ${col}44;">${escapeHtml(spec.category)}</span>
                    <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;"><i class="far fa-calendar-alt"></i> ${formatDate(spec.date || spec.start_date)}</span>
                </div>
                <div style="margin-bottom: 4px;">
                    <h3 style="font-size: 1.15rem; font-weight:800; margin-bottom: 6px; line-height: 1.3;"><a href="#/specs/${spec.id}">${escapeHtml(spec.title)}</a></h3>
                    <p style="color: var(--text-muted); font-size: 0.88rem; font-weight: 600;">@ ${escapeHtml(spec.organization)}</p>
                </div>
                <p style="font-size: 0.95rem; color: var(--text-color); line-height: 1.6; margin: 4px 0;">${escapeHtml(spec.short_description)}</p>
                <a href="#/specs/${spec.id}" style="font-size: 0.88rem; color: var(--accent-color); font-weight: 700; margin-top: auto; display: flex; align-items: center; gap: 6px;">Read more <i class="fas fa-arrow-right" style="font-size:0.75rem;"></i></a>
            </article>`;
        });

        html += `
            </div>
        </div>

        <!-- Latest Posts -->
        <div class="animate-fade-up delay-200" style="margin-top: 48px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; padding: 0 4px;">
                <div>
                    <h2 style="font-size: 1.25rem; font-weight: 800; letter-spacing: var(--ls-tight);">최근 포스트</h2>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-top:2px;">Dev Log</p>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 24px;">
        `;

        posts.slice(0, 3).forEach(post => {
            html += `
            <article class="card feed-card" style="display:flex; flex-direction:column;">
                <div class="feed-header" style="padding: 20px 24px;">
                    <div style="display:flex; align-items:center; gap: 14px;">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--bg-color); border: 1px solid var(--border-color); display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-terminal" style="font-size: 0.85rem; color: var(--text-muted);"></i>
                        </div>
                        <div>
                            <div style="font-weight: 700; font-size:0.95rem;">Dev.log</div>
                            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 1px;">${formatDate(post.created_at)}</div>
                        </div>
                    </div>
                </div>
                <div class="feed-content" style="padding: 28px 32px 32px;">
                    <h3 class="feed-title" style="font-size: 1.25rem; font-weight: 800; margin-bottom: 12px; letter-spacing: var(--ls-tight);"><a href="#/blog/${post.slug}">${escapeHtml(post.title)}</a></h3>
                    <p style="font-size: 0.95rem; color: var(--text-color); margin-bottom: 20px; line-height: 1.6;">${escapeHtml(post.summary)}</p>
                    <div style="font-size: 0.85rem; color: var(--accent-color); font-weight: 600; letter-spacing: 0.02em;">
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
        <div class="animate-fade-up" style="margin-bottom: 24px; padding: 0 10px;">
            <h1 style="font-size: 1.4rem; font-weight: 800; letter-spacing: var(--ls-tight);">About</h1>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top:2px;">안녕하세요, 늘 배움을 즐기는 기록가입니다.</p>
        </div>
        
        <article class="card animate-fade-up delay-100" style="padding: 40px 32px;">
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 24px;">
                <div style="width: 100px; height: 100px; border-radius: 50%; background: transparent; border: 2px solid var(--accent-color); flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 4px;">
                    <img src="${profile.profile_image || 'data/face.jpg'}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; object-position: center;">
                </div>
                <div style="width: 100%;">
                    <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 6px; letter-spacing: var(--ls-tight);">${escapeHtml(profile.name)}</h2>
                    <p style="font-size: 0.95rem; color: var(--accent-color); font-weight: 600; margin-bottom: 20px;">${escapeHtml(profile.major)}</p>
                    
                    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 0; flex-wrap:wrap;">
                        <span class="badge" style="padding: 6px 14px; font-size: 0.8rem;">MBTI: ${escapeHtml(profile.mbti)}</span>
                        <span class="badge" style="padding: 6px 14px; font-size: 0.8rem;"><i class="fas fa-envelope"></i>&nbsp;&nbsp;${escapeHtml(profile.email)}</span>
                    </div>
                </div>
            </div>
            <div style="margin-top: 40px; font-size: 0.95rem; line-height: 1.8; color: var(--text-color); border-top: 1px solid var(--border-color); padding-top: 32px; word-break: keep-all;">
                ${escapeHtml(profile.about_text).replace(/\n/g, '<br>')}
            </div>
        </article>
        
        <article class="card animate-fade-up delay-200" style="margin-top: 24px; padding: 36px 32px;">
            <h3 style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; font-size: 1.15rem; font-weight: 700;">
                <i class="fas fa-graduation-cap" style="color: var(--accent-color);"></i> Education
            </h3>
            <div style="position:relative; margin-left:12px; border-left: 2px solid rgba(0, 209, 178, 0.2); padding-left: 24px; white-space: pre-wrap; line-height: 2.2; font-size: 0.95rem; color: var(--text-color);">${escapeHtml(profile.education_text)}
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
        <div class="animate-fade-up" style="margin-bottom: 24px; padding: 0 10px;">
            <h1 style="font-size: 1.3rem; font-weight: 800; letter-spacing: var(--ls-tight);">Specs</h1>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top:2px;">활동과 성과의 아카이브</p>
        </div>

        <div class="animate-fade-up delay-100">
            <div id="specs-controls" style="margin-bottom: 24px;">${_buildSpecsControls()}</div>
            <div id="specs-list-body" style="transition: opacity 0.2s ease, transform 0.2s ease; display: flex; flex-direction: column; gap: 4px;">
                ${_buildSpecsList()}
            </div>
        </div>
        `;
    },

    SpecDetail: (spec, markdownHtml) => {
        const col = SPEC_CAT_COLORS[spec.category] || 'var(--accent-color)';
        return `
        <div class="animate-fade-up" style="margin-bottom: 24px; padding: 0 10px;">
            <a href="#/specs" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.88rem; color: var(--text-muted); transition: color 0.2s; padding: 10px 0;"
               onmouseover="this.style.color='var(--accent-color)'" onmouseout="this.style.color='var(--text-muted)'">
                <i class="fas fa-arrow-left"></i> 목록으로 돌아가기
            </a>
        </div>

        <article class="card animate-fade-up delay-100" style="padding: 0; overflow: hidden; margin-bottom: 80px;">
            <!-- Premium Header Section -->
            <div style="padding: 48px 32px 36px; border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.01);">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
                    <span style="font-size:0.75rem;font-weight:700;padding:4px 12px;border-radius:999px;background:${col}22;color:${col};border:1px solid ${col}44;">${escapeHtml(spec.category)}</span>
                    <span style="font-size:0.85rem; color:var(--text-muted); font-weight: 600;">${formatDate(spec.date)}</span>
                </div>
                <h1 style="font-size: 1.7rem; font-weight: 800; letter-spacing: var(--ls-tight); margin-bottom: 20px; line-height:1.2; color: var(--text-color);">${escapeHtml(spec.title)}</h1>
                <div style="display:flex; align-items:center; gap:12px; color:var(--text-muted); font-size:0.95rem; font-weight: 600;">
                    <i class="fas fa-building" style="color:var(--accent-color); font-size: 1rem;"></i>
                    <span>${escapeHtml(spec.organization)}</span>
                </div>
            </div>

            <!-- Feature Image -->
            ${spec.image ? `
            <div style="width: 100%; max-height: 400px; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color);">
                <img src="${spec.image}" alt="${escapeHtml(spec.title)}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>` : ''}

            <!-- Content body -->
            <div class="feed-content" style="padding: 40px 32px;">
                <div class="markdown-content">
                    ${markdownHtml}
                </div>

                ${spec.link ? `
                <div style="margin-top: 60px; padding-top: 32px; border-top: 1px solid var(--border-color); text-align: center;">
                    <a href="${spec.link}" target="_blank" class="btn btn-primary" style="padding: 14px 32px; font-size: 0.95rem;"><i class="fas fa-external-link-alt"></i> 결과물 확인하기</a>
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
        <div class="animate-fade-up" style="margin-bottom: 24px; padding: 0 10px;">
            <h1 style="font-size: 1.3rem; font-weight: 800; letter-spacing: var(--ls-tight);">Tech Blog</h1>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top:2px;">탐구와 성장의 기록 아카이브</p>
        </div>

        <div class="animate-fade-up delay-100">
            <div id="blog-controls" style="margin-bottom: 20px;">${_buildBlogControls()}</div>
            <div id="blog-list" style="display:flex; flex-direction:column; gap:24px; transition:opacity 0.2s ease, transform 0.2s ease;">
                ${_buildBlogList()}
            </div>
        </div>
        `;
    },

    PostDetail: (post, markdownHtml, profile) => {
        let tagsStr = (post.tags || []).map(t => `#${t}`).join(' ');
        const col = BLOG_CAT_COLORS[post.category] || 'var(--accent-color)';
        return `
        <div class="animate-fade-up" style="margin-bottom: 24px; padding: 0 10px;">
            <a href="#/blog" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.88rem; color: var(--text-muted); transition: color 0.2s; padding: 10px 0;"
               onmouseover="this.style.color='var(--accent-color)'" onmouseout="this.style.color='var(--text-muted)'">
                <i class="fas fa-arrow-left"></i> 목록으로 돌아가기
            </a>
        </div>
        
        <article class="card feed-card animate-fade-up delay-100" style="overflow: hidden; margin-bottom: 80px;">
            <div class="feed-header" style="padding: 40px 32px 32px; border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.01);">
                 <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 52px; height: 52px; border-radius: 50%; padding:2.5px; border: 2px solid var(--accent-color);">
                        <div style="width:100%; height:100%; border-radius:50%; background:var(--card-bg); display:flex; align-items:center; justify-content:center; overflow: hidden;">
                            <img src="data/face.jpg" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    </div>
                    <div>
                        <div style="font-weight: 800; font-size: 1.15rem; display: flex; align-items: center; gap: 10px; letter-spacing: var(--ls-tight);">
                            ${escapeHtml(profile.name || "JangSW")}
                            <span style="font-size:0.7rem;font-weight:700;padding:3px 10px;border-radius:999px;background:${col}22;color:${col};border:1px solid ${col}44;">${escapeHtml(post.category || '')}</span>
                        </div>
                        <div style="font-size: 0.88rem; color: var(--text-muted); margin-top:4px; font-weight: 600;">${formatDate(post.created_at)}</div>
                    </div>
                </div>
            </div>

            <!-- Feature Image -->
            ${post.image ? `
            <div style="width: 100%; max-height: 400px; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color);">
                <img src="${post.image}" alt="${escapeHtml(post.title)}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>` : ''}
            
            <div class="feed-content" style="padding: 40px 32px;">
                <div style="margin-bottom: 24px; color: var(--accent-color); font-weight:700; font-size: 1.05rem; letter-spacing: 0.05em;">
                    ${escapeHtml(tagsStr)}
                </div>
                <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 40px; letter-spacing: var(--ls-tight); line-height: 1.25; color: var(--text-color);">${escapeHtml(post.title)}</h1>
                
                <div class="markdown-content">
                    ${markdownHtml}
                </div>
            </div>
        </article>
        `;
    },

    Contact: (profile) => {
        return `
        <div class="animate-fade-up" style="margin-bottom: 24px; padding: 0 10px;">
            <h1 style="font-size: 1.3rem; font-weight: 800; letter-spacing: var(--ls-tight);">Contact</h1>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top:2px;">함께 소통하고 성장할 기회를 기다립니다.</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 24px;">
            <article class="card animate-fade-up delay-100" style="display: flex; align-items: center; gap: 24px; padding: 36px 32px;">
                <div style="width: 70px; height: 70px; border-radius: 50%; background: rgba(0, 209, 178, 0.1); color: var(--accent-color); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0;">
                    <i class="fas fa-paper-plane"></i>
                </div>
                <div>
                    <div style="font-size: 1rem; color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">Direct Email</div>
                    <a href="mailto:${escapeHtml(profile.email)}" style="font-size: 1.35rem; font-weight: 800; color: var(--text-color); letter-spacing: var(--ls-tight);">${escapeHtml(profile.email)}</a>
                </div>
            </article>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                ${profile.github_url ? `
                <a href="${profile.github_url}" target="_blank" class="card animate-fade-up delay-200" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 48px 32px; text-align:center;">
                    <i class="fab fa-github" style="font-size: 3.2rem; color: var(--text-color);"></i>
                    <div style="margin-top: 8px;">
                        <span style="font-weight: 800; font-size: 1.15rem; display: block; margin-bottom: 2px;">GitHub</span>
                        <span style="font-size: 0.88rem; color: var(--text-muted);">Project & Contributions</span>
                    </div>
                </a>` : ''}
                
                <a href="#/blog" class="card animate-fade-up delay-300" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 48px 32px; text-align:center;">
                    <i class="fas fa-book" style="font-size: 3.2rem; color: var(--text-color);"></i>
                    <div style="margin-top: 8px;">
                        <span style="font-weight: 800; font-size: 1.15rem; display: block; margin-bottom: 2px;">Tech Blog</span>
                        <span style="font-size: 0.88rem; color: var(--text-muted);">Dev Insight & Life</span>
                    </div>
                </a>

                ${profile.notion_url ? `
                <a href="${profile.notion_url}" target="_blank" class="card animate-fade-up delay-400" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 48px 32px; text-align:center;">
                    <i class="fas fa-book-open" style="font-size: 3.2rem; color: var(--text-color);"></i>
                    <div style="margin-top: 8px;">
                        <span style="font-weight: 800; font-size: 1.15rem; display: block; margin-bottom: 2px;">Notion</span>
                        <span style="font-size: 0.88rem; color: var(--text-muted);">Resume & Portfolio</span>
                    </div>
                </a>` : ''}
            </div>
        </div>
        `;
    }
};
