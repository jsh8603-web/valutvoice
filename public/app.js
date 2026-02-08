// ============ State ============
const state = {
  apiKey: localStorage.getItem('vv_apiKey') || '',
  currentTab: 'memo',
  memoDate: new Date(),
  todayDate: new Date(),
  selectedSection: localStorage.getItem('vv_defaultSection') || '메모',
  tags: [],
  allTags: [],
  favTags: JSON.parse(localStorage.getItem('vv_favTags') || '[]'),
};

// ============ API ============
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.apiKey}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error('Unauthorized');
  }
  return res;
}

// ============ Auth ============
const authScreen = document.getElementById('auth-screen');
const appEl = document.getElementById('app');
const authInput = document.getElementById('auth-input');
const authBtn = document.getElementById('auth-btn');
const authError = document.getElementById('auth-error');

function showAuth() {
  authScreen.hidden = false;
  appEl.hidden = true;
}

function showApp() {
  authScreen.hidden = true;
  appEl.hidden = false;
  init();
}

authBtn.addEventListener('click', async () => {
  const key = authInput.value.trim();
  if (!key) return;
  authBtn.disabled = true;
  try {
    const res = await fetch('/api/health', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    // Health endpoint doesn't require auth, so test with tags
    state.apiKey = key;
    const test = await api('/tags');
    if (test.ok) {
      localStorage.setItem('vv_apiKey', key);
      showApp();
    } else {
      throw new Error('Invalid key');
    }
  } catch (e) {
    authError.textContent = '연결 실패. API 키를 확인하세요.';
    authError.hidden = false;
  }
  authBtn.disabled = false;
});

authInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') authBtn.click();
});

function logout() {
  localStorage.removeItem('vv_apiKey');
  state.apiKey = '';
  showAuth();
}

// ============ Init ============
async function init() {
  setupTabs();
  setupMemo();
  setupToday();
  setupHistory();
  setupSettings();
  loadTags();
}

// ============ Tabs ============
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-item');
  const panels = document.querySelectorAll('.tab-panel');
  const title = document.getElementById('header-title');
  const titles = { memo: '메모', today: '오늘', history: '기록', settings: '설정' };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');
      title.textContent = titles[target];
      state.currentTab = target;

      if (target === 'today') loadToday();
      if (target === 'history') loadHistory();
      if (target === 'settings') refreshSettings();
    });
  });
}

// ============ Date Helpers ============
function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function fmtDateDisplay(d) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = days[d.getDay()];
  const today = new Date();
  if (fmtDate(d) === fmtDate(today)) return `오늘 (${m}/${day} ${dow})`;
  return `${m}/${day} (${dow})`;
}

function shiftDate(d, days) {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

// ============ Memo Tab ============
function setupMemo() {
  const dateDisplay = document.getElementById('date-display');
  const prevBtn = document.getElementById('date-prev');
  const nextBtn = document.getElementById('date-next');
  const memoInput = document.getElementById('memo-input');
  const saveBtn = document.getElementById('save-btn');
  const feedback = document.getElementById('save-feedback');
  const customSection = document.getElementById('custom-section');
  const chips = document.querySelectorAll('.section-chip');

  // Date navigation
  function updateDateDisplay() {
    dateDisplay.textContent = fmtDateDisplay(state.memoDate);
  }
  updateDateDisplay();

  prevBtn.addEventListener('click', () => {
    state.memoDate = shiftDate(state.memoDate, -1);
    updateDateDisplay();
  });
  nextBtn.addEventListener('click', () => {
    state.memoDate = shiftDate(state.memoDate, 1);
    updateDateDisplay();
  });
  dateDisplay.addEventListener('click', () => {
    state.memoDate = new Date();
    updateDateDisplay();
  });

  // Section chips
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const sec = chip.dataset.section;
      if (sec === 'custom') {
        customSection.hidden = false;
        customSection.focus();
      } else {
        customSection.hidden = true;
        state.selectedSection = sec;
      }
    });
  });

  customSection.addEventListener('input', () => {
    state.selectedSection = customSection.value.trim() || '메모';
  });

  // Set default section
  const defaultSec = state.selectedSection;
  const defaultChip = document.querySelector(`.section-chip[data-section="${defaultSec}"]`);
  if (defaultChip) {
    chips.forEach(c => c.classList.remove('active'));
    defaultChip.classList.add('active');
  }

  // Tag input
  setupTagInput();

  // Save
  saveBtn.addEventListener('click', async () => {
    const content = memoInput.value.trim();
    if (!content) {
      memoInput.focus();
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';

    try {
      const res = await api(`/daily/${fmtDate(state.memoDate)}`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          tags: state.tags,
          section: state.selectedSection,
        }),
      });

      if (res.ok) {
        feedback.textContent = '저장 완료!';
        feedback.className = 'save-feedback success';
        feedback.hidden = false;
        memoInput.value = '';
        state.tags = [];
        renderTags();
        // Haptic feedback (if supported)
        if (navigator.vibrate) navigator.vibrate(50);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
    } catch (e) {
      feedback.textContent = '저장 실패: ' + e.message;
      feedback.className = 'save-feedback error';
      feedback.hidden = false;
    }

    saveBtn.disabled = false;
    saveBtn.textContent = '저장';

    setTimeout(() => { feedback.hidden = true; }, 3000);
  });
}

// ============ Tag System ============
function setupTagInput() {
  const tagInput = document.getElementById('tag-input');
  const suggestions = document.getElementById('tag-suggestions');

  tagInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput.value.trim());
      tagInput.value = '';
      suggestions.hidden = true;
    }
  });

  tagInput.addEventListener('input', () => {
    const q = tagInput.value.trim().toLowerCase();
    if (!q) {
      suggestions.hidden = true;
      return;
    }
    const matches = state.allTags
      .filter(t => t.tag.toLowerCase().includes(q) && !state.tags.includes(t.tag))
      .slice(0, 5);

    if (matches.length === 0) {
      suggestions.hidden = true;
      return;
    }

    suggestions.innerHTML = matches.map(t =>
      `<div class="tag-suggestion" data-tag="${t.tag}">${t.tag} <span style="color:var(--text-secondary)">(${t.count})</span></div>`
    ).join('');
    suggestions.hidden = false;
  });

  suggestions.addEventListener('click', e => {
    const el = e.target.closest('.tag-suggestion');
    if (el) {
      addTag(el.dataset.tag);
      tagInput.value = '';
      suggestions.hidden = true;
    }
  });

  // Close suggestions on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.tag-input-wrap')) {
      suggestions.hidden = true;
    }
  });
}

function addTag(tag) {
  if (!tag || state.tags.includes(tag)) return;
  state.tags.push(tag);
  renderTags();
}

function removeTag(tag) {
  state.tags = state.tags.filter(t => t !== tag);
  renderTags();
}

function renderTags() {
  const list = document.getElementById('tag-list');
  list.innerHTML = state.tags.map(t =>
    `<span class="tag-chip">${t}<span class="tag-remove" data-tag="${t}">&times;</span></span>`
  ).join('');

  list.querySelectorAll('.tag-remove').forEach(el => {
    el.addEventListener('click', () => removeTag(el.dataset.tag));
  });
}

async function loadTags() {
  try {
    const res = await api('/tags');
    if (res.ok) {
      const data = await res.json();
      state.allTags = data.tags;
    }
  } catch (e) { /* ignore */ }
}

// ============ Today Tab ============
function setupToday() {
  const prevBtn = document.getElementById('today-prev');
  const nextBtn = document.getElementById('today-next');
  const dateBtn = document.getElementById('today-date');

  function updateDisplay() {
    dateBtn.textContent = fmtDateDisplay(state.todayDate);
  }
  updateDisplay();

  prevBtn.addEventListener('click', () => {
    state.todayDate = shiftDate(state.todayDate, -1);
    updateDisplay();
    loadToday();
  });
  nextBtn.addEventListener('click', () => {
    state.todayDate = shiftDate(state.todayDate, 1);
    updateDisplay();
    loadToday();
  });
  dateBtn.addEventListener('click', () => {
    state.todayDate = new Date();
    updateDisplay();
    loadToday();
  });
}

async function loadToday() {
  const el = document.getElementById('today-content');
  const date = fmtDate(state.todayDate);

  try {
    const res = await api(`/daily/${date}`);
    if (res.status === 404) {
      el.innerHTML = '<div class="empty-state">이 날 일일노트가 없습니다</div>';
      return;
    }
    const data = await res.json();
    el.innerHTML = renderMarkdown(data.body);
  } catch (e) {
    el.innerHTML = `<div class="empty-state">불러오기 실패: ${e.message}</div>`;
  }
}

// ============ History Tab ============
function setupHistory() {
  const searchInput = document.getElementById('history-search');
  const closeBtn = document.getElementById('preview-close');

  searchInput.addEventListener('input', () => {
    filterHistory(searchInput.value.trim().toLowerCase());
  });

  closeBtn.addEventListener('click', () => {
    document.getElementById('history-preview').hidden = true;
  });
}

async function loadHistory() {
  const list = document.getElementById('history-list');
  try {
    const res = await api('/notes/recent');
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();

    if (data.notes.length === 0) {
      list.innerHTML = '<div class="empty-state">최근 기록이 없습니다</div>';
      return;
    }

    list.innerHTML = data.notes.map(note => `
      <div class="history-item" data-date="${note.date}">
        <div class="history-date">${note.date}</div>
        <div class="history-tags">
          ${note.tags.map(t => `<span class="tag-chip">${t}</span>`).join('')}
        </div>
        <div class="history-preview-text">${escapeHtml(note.preview)}</div>
      </div>
    `).join('');

    list.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => openPreview(item.dataset.date));
    });
  } catch (e) {
    list.innerHTML = `<div class="empty-state">불러오기 실패</div>`;
  }
}

function filterHistory(query) {
  const items = document.querySelectorAll('.history-item');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? '' : 'none';
  });
}

async function openPreview(date) {
  const preview = document.getElementById('history-preview');
  const content = document.getElementById('preview-content');
  try {
    const res = await api(`/daily/${date}`);
    const data = await res.json();
    content.innerHTML = `<div class="note-content">${renderMarkdown(data.body)}</div>`;
    preview.hidden = false;
  } catch (e) {
    content.innerHTML = '<div class="empty-state">불러오기 실패</div>';
    preview.hidden = false;
  }
}

// ============ Settings Tab ============
function setupSettings() {
  const logoutBtn = document.getElementById('logout-btn');
  const defaultSection = document.getElementById('default-section');
  const favInput = document.getElementById('fav-tag-input');
  const favAddBtn = document.getElementById('fav-tag-add');

  logoutBtn.addEventListener('click', logout);

  defaultSection.value = state.selectedSection;
  defaultSection.addEventListener('change', () => {
    state.selectedSection = defaultSection.value;
    localStorage.setItem('vv_defaultSection', defaultSection.value);
  });

  favAddBtn.addEventListener('click', () => {
    const tag = favInput.value.trim();
    if (tag && !state.favTags.includes(tag)) {
      state.favTags.push(tag);
      localStorage.setItem('vv_favTags', JSON.stringify(state.favTags));
      favInput.value = '';
      renderFavTags();
    }
  });

  favInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') favAddBtn.click();
  });

  renderFavTags();
}

function renderFavTags() {
  const el = document.getElementById('fav-tags');
  el.innerHTML = state.favTags.map(t =>
    `<span class="tag-chip">${t}<span class="tag-remove fav-remove" data-tag="${t}">&times;</span></span>`
  ).join('');

  el.querySelectorAll('.fav-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      state.favTags = state.favTags.filter(t => t !== btn.dataset.tag);
      localStorage.setItem('vv_favTags', JSON.stringify(state.favTags));
      renderFavTags();
    });
  });
}

async function refreshSettings() {
  const connStatus = document.getElementById('conn-status');
  const vaultPath = document.getElementById('vault-path');

  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.vault) {
      connStatus.textContent = '연결됨';
      connStatus.className = 'status-badge ok';
    } else {
      connStatus.textContent = '볼트 없음';
      connStatus.className = 'status-badge err';
    }
    vaultPath.textContent = data.vaultPath || '-';
  } catch (e) {
    connStatus.textContent = '오프라인';
    connStatus.className = 'status-badge err';
  }
}

// ============ Markdown Renderer (lightweight) ============
function renderMarkdown(md) {
  if (!md) return '';
  let html = escapeHtml(md);

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered list items
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Paragraphs (double newlines)
  html = html.replace(/\n\n+/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[123]>)/g, '$1');
  html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1');

  return html;
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ============ Service Worker ============
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ============ Boot ============
if (state.apiKey) {
  showApp();
} else {
  showAuth();
}
