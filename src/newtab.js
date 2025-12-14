const BACK_TO_TOP_THRESHOLD = 420;

const state = {
  articles: [],
  sources: [],
  settings: {},
  tags: [],
  lastFetchedAt: null,
  unreadCount: 0
};

const filters = {
  sourceId: 'all',
  onlyUnread: false,
  search: ''
};

const favoriteFilters = {
  tagId: 'all',
  sourceId: 'all',
  onlyUnread: false,
  search: ''
};

let currentView = 'home';
let searchTimer;
let favoriteSearchTimer;
let suppressLoadingOverlay = false;
let activeTagMenuArticleId = null;
let editingSource = null;

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  loadState();
});

function bindEvents() {
  qs('#refresh-btn').addEventListener('click', handleRefresh);
  qs('#source-filter').addEventListener('change', (e) => {
    filters.sourceId = e.target.value;
    renderHome();
  });
  qs('#unread-only').addEventListener('change', (e) => {
    filters.onlyUnread = e.target.checked;
    renderHome();
  });
  qs('#search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filters.search = e.target.value.trim();
      renderHome();
    }, 200);
  });

  qsa('.bottom-nav button').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  qs('#detail-close').addEventListener('click', closeDetail);

  qs('#add-source-form').addEventListener('submit', handleAddSource);
  qs('#setting-interval').addEventListener('change', handleSettingsChange);
  qs('#setting-notify').addEventListener('change', handleSettingsChange);
  qs('#setting-badge').addEventListener('change', handleSettingsChange);
  qs('#setting-newtab').addEventListener('change', handleSettingsChange);
  qs('#clear-data-btn').addEventListener('click', handleClearData);
  qs('#cancel-loading-btn').addEventListener('click', handleCancelLoading);
  qs('#create-tag-form')?.addEventListener('submit', handleCreateTag);
  const favoriteSearchInput = qs('#favorite-search');
  if (favoriteSearchInput) {
    favoriteSearchInput.addEventListener('input', handleFavoriteSearchInput);
  }
  const favoriteSourceSelect = qs('#favorite-source-filter');
  if (favoriteSourceSelect) {
    favoriteSourceSelect.addEventListener('change', handleFavoriteSourceChange);
  }
  const favoriteTagSelect = qs('#favorite-tag-filter');
  if (favoriteTagSelect) {
    favoriteTagSelect.addEventListener('change', handleFavoriteTagChange);
  }
  const favoriteUnreadCheckbox = qs('#favorite-unread-only');
  if (favoriteUnreadCheckbox) {
    favoriteUnreadCheckbox.addEventListener('change', handleFavoriteUnreadChange);
  }
  const backToTopBtn = qs('#back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', handleBackToTopClick);
  }
  window.addEventListener('scroll', handlePageScroll);
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('scroll', closeTagMenu, true);
  document.addEventListener('keydown', handleKeydown);
  qs('#tag-menu-close')?.addEventListener('click', closeTagMenu);
  qs('#tag-menu-manage')?.addEventListener('click', () => {
    closeTagMenu();
    switchView('settings');
  });
  const editSourceModal = qs('#edit-source-modal');
  if (editSourceModal) {
    editSourceModal.addEventListener('click', (event) => {
      if (event.target === editSourceModal) {
        closeEditSourceModal();
      }
    });
  }
  qs('#edit-source-close')?.addEventListener('click', closeEditSourceModal);
  qs('#edit-source-cancel')?.addEventListener('click', closeEditSourceModal);
  qs('#edit-source-form')?.addEventListener('submit', handleEditSourceSubmit);
}

async function loadState() {
  setLoading(true);
  try {
    const res = await sendMessage({ type: 'getState' });
    state.articles = normalizeArticles(res.articles ?? []);
    state.sources = res.sources ?? [];
    state.settings = res.settings ?? {};
    state.tags = res.tags ?? [];
    state.lastFetchedAt = res.lastFetchedAt ?? null;
    state.unreadCount = res.unreadCount ?? 0;
    renderFilters();
    renderFavoriteFilters();
    renderHome();
    renderFavorites();
    renderSources();
    renderSettings();
    updateLastUpdated();
    updateBackToTopVisibility();
  } catch (error) {
    showToast('加载失败，请重试');
    console.error(error);
  } finally {
    setLoading(false);
  }
}

async function handleRefresh() {
  setLoading(true);
  showToast('正在刷新...');
  try {
    await sendMessage({ type: 'refresh' });
    await loadState();
    showToast('已更新');
  } catch (error) {
    showToast('刷新失败');
  } finally {
    setLoading(false);
  }
}

function handleCancelLoading() {
  const loadingEl = qs('#loading');
  if (loadingEl.classList.contains('hidden')) return;
  suppressLoadingOverlay = true;
  loadingEl.classList.add('hidden');
  showToast('已停止刷新，可稍后重试');
}

function renderFilters() {
  const select = qs('#source-filter');
  const current = filters.sourceId;
  select.innerHTML = '';
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = '全部来源';
  select.appendChild(all);
  state.sources.forEach((src) => {
    const opt = document.createElement('option');
    opt.value = src.id;
    opt.textContent = src.name;
    select.appendChild(opt);
  });
  const hasMatch = state.sources.some((src) => src.id === current);
  select.value = hasMatch ? current : 'all';
  filters.sourceId = select.value;
}

function renderHome() {
  const list = applyFilters(state.articles);
  renderList(list, '#news-list', '#empty-home');
}

function renderFavorites() {
  const favs = state.articles.filter((a) => a.isFavorite);
  const filtered = favs.filter((item) => {
    if (
      favoriteFilters.sourceId !== 'all' &&
      item.sourceId !== favoriteFilters.sourceId
    ) {
      return false;
    }
    if (favoriteFilters.tagId !== 'all') {
      if (!Array.isArray(item.tags) || !item.tags.includes(favoriteFilters.tagId)) {
        return false;
      }
    }
    if (favoriteFilters.onlyUnread && item.isRead) {
      return false;
    }
    if (favoriteFilters.search) {
      const keyword = favoriteFilters.search.toLowerCase();
      const key = `${item.title ?? ''} ${item.summary ?? ''} ${item.sourceName ?? ''}`.toLowerCase();
      if (!key.includes(keyword)) return false;
    }
    return true;
  });
  renderList(filtered, '#favorite-list', '#empty-fav');
  updateFavoriteCount(filtered.length, favs.length);
}

function renderFavoriteFilters() {
  const sourceSelect = qs('#favorite-source-filter');
  if (sourceSelect) {
    const currentSource = favoriteFilters.sourceId;
    sourceSelect.innerHTML = '<option value="all">全部来源</option>';
    const favoriteSources = getFavoriteSourceOptions();
    favoriteSources.forEach((src) => {
      const option = document.createElement('option');
      option.value = src.id;
      option.textContent = src.name;
      sourceSelect.appendChild(option);
    });
    const hasSource = favoriteSources.some((src) => src.id === currentSource);
    sourceSelect.value = hasSource ? currentSource : 'all';
    favoriteFilters.sourceId = sourceSelect.value;
    sourceSelect.disabled = favoriteSources.length === 0;
  }

  const tagSelect = qs('#favorite-tag-filter');
  if (tagSelect) {
    const current = favoriteFilters.tagId;
    tagSelect.innerHTML = '<option value="all">全部标签</option>';
    const tags = getSortedTags();
    tags.forEach((tag) => {
      const option = document.createElement('option');
      option.value = tag.id;
      option.textContent = tag.name;
      tagSelect.appendChild(option);
    });
    const stillValid = tags.some((tag) => tag.id === current);
    tagSelect.value = stillValid ? current : 'all';
    favoriteFilters.tagId = tagSelect.value;
    tagSelect.disabled = tags.length === 0;
  }

  const input = qs('#favorite-search');
  if (input) {
    input.value = favoriteFilters.search;
  }

  const unreadCheckbox = qs('#favorite-unread-only');
  if (unreadCheckbox) {
    unreadCheckbox.checked = !!favoriteFilters.onlyUnread;
  }
}

function updateFavoriteCount(visible, total) {
  const el = qs('#favorite-result-count');
  if (!el) return;
  if (!total) {
    el.textContent = '';
    return;
  }
  if (visible) {
    el.textContent = `共 ${visible} 条收藏`;
    return;
  }
  if (
    favoriteFilters.tagId !== 'all' ||
    favoriteFilters.sourceId !== 'all' ||
    favoriteFilters.onlyUnread ||
    favoriteFilters.search
  ) {
    el.textContent = '筛选结果为空';
  } else {
    el.textContent = '';
  }
}

function handleFavoriteSearchInput(event) {
  const target = event.target;
  if (!target) return;
  clearTimeout(favoriteSearchTimer);
  favoriteSearchTimer = setTimeout(() => {
    favoriteFilters.search = target.value.trim();
    renderFavorites();
  }, 200);
}

function handleFavoriteTagChange(event) {
  favoriteFilters.tagId = event.target.value;
  renderFavorites();
}

function handleFavoriteSourceChange(event) {
  favoriteFilters.sourceId = event.target.value;
  renderFavorites();
}

function handleFavoriteUnreadChange(event) {
  favoriteFilters.onlyUnread = event.target.checked;
  renderFavorites();
}

function applyFilters(list) {
  return list.filter((item) => {
    if (filters.sourceId !== 'all' && item.sourceId !== filters.sourceId) {
      return false;
    }
    if (filters.onlyUnread && item.isRead) return false;
    if (filters.search) {
      const key = `${item.title ?? ''} ${item.sourceName ?? ''}`.toLowerCase();
      if (!key.includes(filters.search.toLowerCase())) return false;
    }
    return true;
  });
}

function renderList(data, listSelector, emptySelector) {
  const container = qs(listSelector);
  const empty = qs(emptySelector);
  container.innerHTML = '';
  if (!data.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  data.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = item.id;
    const tagsSection = buildTagSection(item);
    const sourceSection = buildSourceSection(item);
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${item.title}</div>
      </div>
      <div class="card-summary">${item.summary || '暂无摘要'}</div>
      ${tagsSection}
      ${sourceSection}
      <div class="card-footer">
        <span>${formatDate(item.publishedAt)}</span>
        <div class="actions">
          <span
            class="badge read-toggle"
            style="background:${item.isRead ? '#eef2ff' : '#e8f5e9'};color:${item.isRead ? '#5b21b6' : '#2e7d32'}"
          >
            ${item.isRead ? '已读' : '未读'}
          </span>
          <button class="btn ghost favorite-btn">${item.isFavorite ? '★ 收藏' : '☆ 收藏'}</button>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openDetail(item.id));
    card.addEventListener('contextmenu', (event) => openTagMenu(event, item.id));
    card.querySelector('.read-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleReadState(item.id);
    });
    card.querySelector('.favorite-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(item.id);
    });
    container.appendChild(card);
  });
}

function openTagMenu(event, articleId) {
  event.preventDefault();
  event.stopPropagation();
  const menu = qs('#tag-context-menu');
  if (!menu) return;
  const article = state.articles.find((item) => item.id === articleId);
  if (!article) return;
  activeTagMenuArticleId = articleId;
  const pointerX = event.clientX;
  const pointerY = event.clientY;
  menu.style.visibility = 'hidden';
  menu.classList.remove('hidden');
  renderTagMenuList(article);
  requestAnimationFrame(() => {
    positionTagMenu(menu, pointerX, pointerY);
    menu.style.visibility = '';
  });
}

function renderTagMenuList(article) {
  const list = qs('#tag-menu-list');
  if (!list) return;
  list.innerHTML = '';
  const tags = getSortedTags();
  if (!tags.length) {
    const empty = document.createElement('div');
    empty.className = 'tag-menu-empty';
    empty.textContent = '暂无标签，可前往设置页新建';
    list.appendChild(empty);
    return;
  }
  tags.forEach((tag) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tag-menu-item';
    const hasTag = Array.isArray(article.tags) && article.tags.includes(tag.id);
    if (hasTag) {
      button.classList.add('active');
    }
    button.textContent = tag.name;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      handleToggleTag(article.id, tag.id);
    });
    list.appendChild(button);
  });
}

function positionTagMenu(menu, x, y) {
  const { innerWidth, innerHeight } = window;
  const rect = menu.getBoundingClientRect();
  const width = rect.width || 240;
  const height = rect.height || 200;
  const padding = 12;
  const left = Math.min(
    Math.max(x + 2, padding),
    innerWidth - width - padding
  );
  const top = Math.min(
    Math.max(y + 2, padding),
    innerHeight - height - padding
  );
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function closeTagMenu() {
  const menu = qs('#tag-context-menu');
  if (!menu) return;
  if (!menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
  }
  activeTagMenuArticleId = null;
}

function handleGlobalClick(event) {
  const menu = qs('#tag-context-menu');
  if (!menu || menu.classList.contains('hidden')) return;
  if (menu.contains(event.target)) return;
  closeTagMenu();
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeTagMenu();
    closeEditSourceModal();
  }
}

async function handleToggleTag(articleId, tagId) {
  try {
    const res = await sendMessage({
      type: 'toggleArticleTag',
      articleId,
      tagId
    });
    if (Array.isArray(res?.articles)) {
      state.articles = normalizeArticles(res.articles);
    } else {
      state.articles = normalizeArticles(
        state.articles.map((article) => {
          if (article.id !== articleId) return article;
          const current = Array.isArray(article.tags) ? article.tags : [];
          const has = current.includes(tagId);
          const next = has
            ? current.filter((value) => value !== tagId)
            : [...current, tagId];
          return { ...article, tags: next };
        })
      );
    }
    renderHome();
    renderFavorites();
    if (activeTagMenuArticleId === articleId) {
      const updated = state.articles.find((item) => item.id === articleId);
      if (updated) {
        renderTagMenuList(updated);
      } else {
        closeTagMenu();
      }
    }
  } catch (error) {
    console.error(error);
    showToast('打标签失败');
  }
}

function buildTagSection(article) {
  const list = Array.isArray(article.tags) ? article.tags : [];
  if (!list.length || !state.tags?.length) {
    return '';
  }
  const chips = list
    .map((tagId) => state.tags.find((tag) => tag.id === tagId))
    .filter(Boolean)
    .map((tag) => `<span class="tag-chip">${tag.name}</span>`)
    .join('');
  if (!chips) return '';
  return `<div class="card-tags">${chips}</div>`;
}

function buildSourceSection(article) {
  const name = article.sourceName || '未知来源';
  return `<div class="card-source"><span class="badge badge-source">${name}</span></div>`;
}

async function openDetail(articleId) {
  const article = state.articles.find((a) => a.id === articleId);
  if (!article) return;
  const drawer = qs('#detail-drawer');
  qs('#detail-title').textContent = article.title;
  qs('#detail-meta').textContent = `${article.sourceName} · ${formatDate(
    article.publishedAt
  )}`;
  qs('#detail-content').textContent = article.content || article.summary || '';
  const link = qs('#detail-link');
  link.href = article.link || '#';
  link.target = state.settings.openInNewTab === false ? '_self' : '_blank';
  drawer.classList.remove('hidden');

  if (!article.isRead) {
    await sendMessage({ type: 'markRead', id: articleId });
    article.isRead = true;
    renderHome();
    renderFavorites();
  }
}

function closeDetail() {
  qs('#detail-drawer').classList.add('hidden');
}

async function toggleFavorite(id) {
  try {
    await sendMessage({ type: 'toggleFavorite', id });
    state.articles = state.articles.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    renderHome();
    renderFavoriteFilters();
    renderFavorites();
  } catch (error) {
    showToast('收藏操作失败');
  }
}

async function toggleReadState(id) {
  try {
    await sendMessage({ type: 'toggleRead', id });
    state.articles = state.articles.map((item) =>
      item.id === id ? { ...item, isRead: !item.isRead } : item
    );
    renderHome();
    renderFavorites();
  } catch (error) {
    showToast('切换阅读状态失败');
  }
}

function renderSources() {
  const list = qs('#source-list');
  list.innerHTML = '';
  state.sources.forEach((src) => {
    const row = document.createElement('div');
    row.className = 'source-row';
    row.innerHTML = `
      <div class="source-info">
        <div class="source-name">${src.name}</div>
        <div class="source-url">${src.feedUrl || src.pageUrl || '待填入 RSS 链接'}</div>
      </div>
      <div class="actions source-actions">
        <label class="checkbox">
          <input type="checkbox" ${src.enabled !== false ? 'checked' : ''} />
          <span>启用</span>
        </label>
        <button class="btn ghost edit-btn">编辑</button>
        <button class="btn ghost remove-btn">删除</button>
      </div>
    `;
    row.querySelector('input').addEventListener('change', async (e) => {
      await sendMessage({
        type: 'updateSource',
        id: src.id,
        payload: { enabled: e.target.checked }
      });
      showToast('已更新源状态');
      renderFavoriteFilters();
    });
    row.querySelector('.edit-btn').addEventListener('click', () => {
      handleEditSource(src);
    });
    row.querySelector('.remove-btn').addEventListener('click', async () => {
      await sendMessage({ type: 'removeSource', id: src.id });
      state.sources = state.sources.filter((s) => s.id !== src.id);
      renderSources();
      renderFilters();
      renderHome();
      renderFavoriteFilters();
      renderFavorites();
    });
    list.appendChild(row);
  });
}

function handleEditSource(source) {
  if (!source) return;
  editingSource = source;
  openEditSourceModal(source);
}

function openEditSourceModal(source) {
  const modal = qs('#edit-source-modal');
  const form = qs('#edit-source-form');
  if (!modal || !form) return;
  const nameInput = qs('#edit-source-name');
  const feedInput = qs('#edit-source-url');
  const pageInput = qs('#edit-source-page');
  if (nameInput) {
    nameInput.value = source.name || '';
  }
  if (feedInput) {
    feedInput.value = source.feedUrl || source.pageUrl || '';
  }
  if (pageInput) {
    pageInput.value = source.pageUrl || '';
  }
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    nameInput?.focus();
    nameInput?.select();
  });
}

function closeEditSourceModal() {
  const modal = qs('#edit-source-modal');
  if (!modal) return;
  if (!modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
  }
  modal.setAttribute('aria-hidden', 'true');
  qs('#edit-source-form')?.reset();
  editingSource = null;
}

async function handleEditSourceSubmit(event) {
  event.preventDefault();
  if (!editingSource) {
    showToast('未找到要编辑的 RSS 源');
    return;
  }
  const formElement = event.target;
  const formData = new FormData(formElement);
  const nextName = (formData.get('name') || '').trim();
  const nextFeedUrl = (formData.get('feedUrl') || '').trim();
  const providedPageUrl = (formData.get('pageUrl') || '').trim();
  if (!nextName || !nextFeedUrl) {
    showToast('名称和 RSS 链接均不能为空');
    return;
  }
  const payload = { name: nextName, feedUrl: nextFeedUrl };
  if (providedPageUrl) {
    payload.pageUrl = providedPageUrl;
  } else if (!editingSource.pageUrl) {
    payload.pageUrl = nextFeedUrl;
  }
  try {
    const res = await sendMessage({
      type: 'updateSource',
      id: editingSource.id,
      payload
    });
    if (res?.sources) {
      state.sources = res.sources;
    } else {
      state.sources = state.sources.map((item) =>
        item.id === editingSource.id ? { ...item, ...payload } : item
      );
    }
    state.articles = state.articles.map((article) =>
      article.sourceId === editingSource.id
        ? { ...article, sourceName: nextName }
        : article
    );
    renderSources();
    renderFilters();
    renderHome();
    renderFavoriteFilters();
    renderFavorites();
    showToast('RSS 源已更新');
    closeEditSourceModal();
  } catch (error) {
    console.error(error);
    showToast('更新源失败');
  }
}

async function handleAddSource(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  if (!payload.name || !payload.feedUrl) {
    showToast('请填写源名称与 RSS 链接');
    return;
  }
  try {
    await sendMessage({ type: 'addSource', payload });
    showToast('已添加新源');
    form.reset();
    await loadState();
    switchView('sources');
  } catch (error) {
    showToast('添加失败');
  }
}

function renderSettings() {
  qs('#setting-interval').value =
    state.settings.updateIntervalHours ?? 6;
  qs('#setting-notify').checked = !!state.settings.notificationsEnabled;
  qs('#setting-badge').checked = state.settings.unreadBadge !== false;
  qs('#setting-newtab').checked = state.settings.openInNewTab !== false;
  renderTagManager();
}

function renderTagManager() {
  const list = qs('#tag-list');
  if (!list) return;
  list.innerHTML = '';
  const tags = getSortedTags();
  if (!tags.length) {
    const empty = document.createElement('div');
    empty.className = 'tag-manager-empty';
    empty.textContent = '暂无标签，使用下方输入框新建';
    list.appendChild(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  tags.forEach((tag) => {
    const row = document.createElement('div');
    row.className = 'tag-item';

    const name = document.createElement('span');
    name.className = 'tag-name';
    name.textContent = tag.name;

    const actions = document.createElement('div');
    actions.className = 'tag-actions';

    const renameBtn = document.createElement('button');
    renameBtn.type = 'button';
    renameBtn.className = 'btn ghost small tag-action';
    renameBtn.textContent = '重命名';
    renameBtn.addEventListener('click', () => handleRenameTag(tag.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn ghost small tag-action delete';
    deleteBtn.textContent = '删除';
    deleteBtn.addEventListener('click', () => handleDeleteTag(tag.id));

    actions.append(renameBtn, deleteBtn);
    row.append(name, actions);
    fragment.append(row);
  });
  list.appendChild(fragment);
}

async function handleCreateTag(event) {
  event.preventDefault();
  const input = qs('#new-tag-input');
  if (!input) return;
  const value = input.value.trim();
  if (!value) {
    showToast('请输入标签名称');
    return;
  }
  try {
    const res = await sendMessage({ type: 'createTag', name: value });
    if (Array.isArray(res?.tags)) {
      state.tags = res.tags;
    } else {
      state.tags = [
        ...state.tags,
        {
          id: `tag-${Date.now()}`,
          name: value,
          createdAt: Date.now()
        }
      ];
    }
    input.value = '';
    renderTagManager();
    renderFavoriteFilters();
    if (activeTagMenuArticleId) {
      const article = state.articles.find(
        (item) => item.id === activeTagMenuArticleId
      );
      if (article) {
        renderTagMenuList(article);
      }
    }
    showToast('标签已创建');
  } catch (error) {
    showToast(error?.message || '创建标签失败');
  }
}

async function handleRenameTag(tagId) {
  const target = state.tags.find((tag) => tag.id === tagId);
  if (!target) return;
  const nextName = prompt('请输入新的标签名称', target.name || '');
  if (nextName === null) return;
  const value = nextName.trim();
  if (!value) {
    showToast('标签名称不能为空');
    return;
  }
  try {
    const res = await sendMessage({ type: 'renameTag', id: tagId, name: value });
    if (Array.isArray(res?.tags)) {
      state.tags = res.tags;
    } else {
      state.tags = state.tags.map((tag) =>
        tag.id === tagId ? { ...tag, name: value } : tag
      );
    }
    renderTagManager();
    renderFavoriteFilters();
    renderHome();
    renderFavorites();
    if (activeTagMenuArticleId) {
      const article = state.articles.find((item) => item.id === activeTagMenuArticleId);
      if (article) {
        renderTagMenuList(article);
      }
    }
    showToast('标签已重命名');
  } catch (error) {
    showToast(error?.message || '重命名失败');
  }
}

async function handleDeleteTag(tagId) {
  const target = state.tags.find((tag) => tag.id === tagId);
  if (!target) return;
  if (
    !confirm(`删除标签“${target.name}”后，已标记的资讯会失去该标签，确认继续？`)
  )
    return;
  try {
    const res = await sendMessage({ type: 'deleteTag', id: tagId });
    if (Array.isArray(res?.tags)) {
      state.tags = res.tags;
    } else {
      state.tags = state.tags.filter((tag) => tag.id !== tagId);
    }
    if (Array.isArray(res?.articles)) {
      state.articles = normalizeArticles(res.articles);
    } else {
      state.articles = normalizeArticles(
        state.articles.map((article) => ({
          ...article,
          tags: Array.isArray(article.tags)
            ? article.tags.filter((value) => value !== tagId)
            : []
        }))
      );
    }
    renderTagManager();
    renderFavoriteFilters();
    renderHome();
    renderFavorites();
    if (activeTagMenuArticleId) {
      const article = state.articles.find((item) => item.id === activeTagMenuArticleId);
      if (article) {
        renderTagMenuList(article);
      } else {
        closeTagMenu();
      }
    }
    showToast('标签已删除');
  } catch (error) {
    showToast(error?.message || '删除标签失败');
  }
}

async function handleSettingsChange() {
  const payload = {
    updateIntervalHours: Number(qs('#setting-interval').value || 6),
    notificationsEnabled: qs('#setting-notify').checked,
    unreadBadge: qs('#setting-badge').checked,
    openInNewTab: qs('#setting-newtab').checked
  };
  try {
    await sendMessage({ type: 'updateSettings', payload });
    state.settings = payload;
    showToast('设置已保存');
  } catch (error) {
    showToast('保存设置失败');
  }
}

async function handleClearData() {
  if (!confirm('确定要重置数据并恢复预置源吗？')) return;
  await sendMessage({ type: 'clearData' });
  await loadState();
  showToast('数据已重置');
}

function switchView(view) {
  currentView = view;
  qsa('.view').forEach((el) => el.classList.remove('active'));
  const target = qs(`#view-${view}`);
  if (target) target.classList.add('active');
  qsa('.bottom-nav button').forEach((btn) =>
    btn.classList.toggle('active', btn.dataset.view === view)
  );
  updateFiltersVisibility();
  if (view === 'favorites') {
    renderFavorites();
  }
  updateBackToTopVisibility();
}

function updateFiltersVisibility() {
  const filtersEl = qs('.filters');
  if (!filtersEl) return;
  const shouldHide = currentView !== 'home';
  filtersEl.classList.toggle('hidden', shouldHide);
}

function handlePageScroll() {
  updateBackToTopVisibility();
}

function handleBackToTopClick() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function updateBackToTopVisibility() {
  const button = qs('#back-to-top');
  if (!button) return;
  const shouldShow = shouldShowBackToTop();
  button.classList.toggle('show', shouldShow);
}

function shouldShowBackToTop() {
  if (currentView !== 'home' && currentView !== 'favorites') {
    return false;
  }
  return window.scrollY > BACK_TO_TOP_THRESHOLD;
}

function updateLastUpdated() {
  const text = state.lastFetchedAt
    ? `最近更新：${formatDate(state.lastFetchedAt)}`
    : '最近更新：--';
  qs('#last-updated').textContent = text;
}

function getSortedTags() {
  return [...(state.tags ?? [])].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'zh-CN')
  );
}

function getFavoriteSourceOptions() {
  const map = new Map();
  state.articles
    .filter((item) => item.isFavorite)
    .forEach((article) => {
      if (!article.sourceId) return;
      if (!map.has(article.sourceId)) {
        map.set(article.sourceId, article.sourceName || '未知来源');
      }
    });
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'));
}

function normalizeArticles(list = []) {
  return (list ?? []).map((item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : []
  }));
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

function showToast(message) {
  const el = qs('#toast');
  el.textContent = message;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 1800);
}

function setLoading(isLoading) {
  const loadingEl = qs('#loading');
  if (isLoading) {
    if (suppressLoadingOverlay) return;
    loadingEl.classList.remove('hidden');
    return;
  }
  suppressLoadingOverlay = false;
  loadingEl.classList.add('hidden');
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
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


