const state = {
  articles: [],
  sources: [],
  settings: {},
  unread: 0
};

const ui = {};

document.addEventListener('DOMContentLoaded', () => {
  ui.sourceSelect = document.getElementById('popup-source');
  ui.list = document.getElementById('popup-list');
  ui.empty = document.getElementById('popup-empty');
  ui.loading = document.getElementById('popup-loading');
  ui.unread = document.getElementById('popup-unread');
  ui.viewMore = document.getElementById('view-more');

  ui.sourceSelect.addEventListener('change', () => {
    renderList(ui.sourceSelect.value);
  });
  ui.viewMore.addEventListener('click', openFullPage);

  loadState();
});

async function loadState() {
  setLoading(true);
  try {
    const res = await sendMessage({ type: 'getState' });
    state.articles = Array.isArray(res?.articles) ? res.articles : [];
    state.sources = (res?.sources || []).filter((item) => item.enabled !== false);
    state.settings = res?.settings || {};
    state.unread = Number(res?.unreadCount || 0);
    updateUnreadBadge();
    renderSourceOptions();
    const initialId = state.sources[0]?.id ?? '';
    if (initialId) {
      ui.sourceSelect.value = initialId;
      renderList(initialId);
    } else {
      renderList('');
    }
  } catch (error) {
    console.error('加载弹窗数据失败', error);
    showEmpty('加载失败，请稍后重试');
  } finally {
    setLoading(false);
  }
}

function renderSourceOptions() {
  ui.sourceSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = state.sources.length
    ? '请选择 RSS 频道'
    : '暂无可用频道';
  placeholder.disabled = true;
  placeholder.selected = true;
  ui.sourceSelect.appendChild(placeholder);

  state.sources.forEach((src) => {
    const option = document.createElement('option');
    option.value = src.id;
    option.textContent = src.name;
    ui.sourceSelect.appendChild(option);
  });

  ui.sourceSelect.disabled = state.sources.length === 0;
}

function renderList(sourceId) {
  ui.list.innerHTML = '';
  if (!sourceId) {
    showEmpty(
      state.sources.length
        ? '请选择RSS频道查看最新内容'
        : '暂无可用频道，可在主页管理 RSS 源'
    );
    return;
  }

  const items = state.articles
    .filter((article) => article.sourceId === sourceId)
    .slice(0, 3);

  if (!items.length) {
    showEmpty('该频道暂无最新内容');
    return;
  }

  hideEmpty();
  items.forEach((article) => {
    const link = document.createElement('a');
    link.className = 'popup-item';
    link.href = article.link || '#';
    link.target = state.settings.openInNewTab === false ? '_self' : '_blank';
    link.rel = 'noreferrer';

    const title = document.createElement('div');
    title.className = 'popup-item-title';
    title.textContent = article.title || '未命名文章';

    const meta = document.createElement('div');
    meta.className = 'popup-item-meta';
    meta.textContent = `${article.sourceName || ''} · ${formatDate(
      article.publishedAt
    )}`;

    link.appendChild(title);
    link.appendChild(meta);

    ui.list.appendChild(link);
  });
}

function showEmpty(message) {
  ui.list.classList.add('hidden');
  ui.empty.textContent = message;
  ui.empty.classList.remove('hidden');
}

function hideEmpty() {
  ui.list.classList.remove('hidden');
  ui.empty.classList.add('hidden');
}

function setLoading(isLoading) {
  ui.loading.classList.toggle('hidden', !isLoading);
  if (isLoading) {
    ui.list.classList.add('hidden');
    ui.empty.classList.add('hidden');
  }
}

function updateUnreadBadge() {
  const unread = Math.max(0, Math.min(999, state.unread));
  ui.unread.textContent = unread > 0 ? `未读 ${unread}` : '暂无未读';
}

function openFullPage() {
  const url = chrome.runtime.getURL('src/newtab.html');
  if (chrome.tabs?.create) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank', 'noopener');
  }
  window.close();
}

function sendMessage(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response);
    });
  });
}

function formatDate(value) {
  const date = new Date(value || Date.now());
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

