import {
  DEFAULT_SETTINGS,
  DEFAULT_SOURCES,
  STORAGE_KEYS
} from './shared/constants.js';
import {
  clearAllData,
  ensureDefaults,
  getState,
  saveArticles,
  saveSettings,
  saveSources,
  saveTags,
  updateLastFetched
} from './shared/storage.js';

const ALARM_NAME = 'autoFetch';
const MIN_INTERVAL_MINUTES = 10;
const MAX_BADGE = 999;

chrome.runtime.onInstalled.addListener(async () => {
  const initState = await ensureDefaults();
  await scheduleAutoUpdate(initState.settings.updateIntervalHours);
  await fetchAndStore({ reason: 'install', notify: false });
});

chrome.runtime.onStartup.addListener(async () => {
  const initState = await ensureDefaults();
  await scheduleAutoUpdate(initState.settings.updateIntervalHours);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    fetchAndStore({ reason: 'alarm', notify: true }).catch((err) =>
      console.warn('auto fetch failed', err)
    );
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      console.error('message failed', error);
      sendResponse({ error: error?.message ?? String(error) });
    });
  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case 'getState':
      return buildStateResponse();
    case 'refresh':
      return fetchAndStore({ reason: 'manual', notify: true });
    case 'toggleFavorite':
      return toggleFavorite(message.id);
    case 'markRead':
      return markRead(message.id);
    case 'toggleRead':
      return toggleRead(message.id);
    case 'addSource':
      return addSource(message.payload);
    case 'updateSource':
      return updateSource(message.id, message.payload);
    case 'removeSource':
      return removeSource(message.id);
    case 'updateSettings':
      return changeSettings(message.payload);
    case 'createTag':
      return createTag(message.name);
    case 'renameTag':
      return renameTag(message.id, message.name);
    case 'toggleArticleTag':
      return toggleArticleTag(message.articleId, message.tagId);
    case 'deleteTag':
      return deleteTag(message.id);
    case 'clearData':
      await clearAllData();
      return buildStateResponse();
    default:
      return { ok: true };
  }
}

async function buildStateResponse() {
  const { articles, sources, settings, lastFetchedAt, tags } = await getState();
  const sorted = sortArticles(articles);
  const unread = sorted.filter((item) => !item.isRead).length;
  await updateBadge(unread, settings);
  return {
    articles: sorted,
    sources,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    tags,
    lastFetchedAt,
    unreadCount: unread
  };
}

async function fetchAndStore({ reason, notify = true } = {}) {
  const { sources, articles, settings } = await ensureDefaults();
  const enabledSources = sources.filter((s) => s.enabled !== false);
  const incoming = [];
  const discoveredSources = [...sources];

  for (const source of enabledSources) {
    try {
      const feedUrl = source.feedUrl?.trim();
      // 没有可用 feed 链接则跳过
      if (!feedUrl) {
        continue;
      }
      const items = await fetchFeedItems(feedUrl, source);
      incoming.push(...items);
    } catch (error) {
      console.warn(`读取源失败: ${source.name}`, error);
    }
  }

  if (JSON.stringify(discoveredSources) !== JSON.stringify(sources)) {
    await saveSources(discoveredSources);
  }

  const merged = mergeArticles(articles, incoming);
  const sorted = sortArticles(merged);
  await saveArticles(sorted);
  const now = Date.now();
  await updateLastFetched(now);

  const unread = sorted.filter((item) => !item.isRead).length;
  await updateBadge(unread, settings);

  const added = merged.length - articles.length;
  if (notify && settings.notificationsEnabled && added > 0) {
    await notifyNewArticles(added, reason, settings.updateIntervalHours);
  }

  return {
    ok: true,
    added,
    total: sorted.length,
    unread,
    lastFetchedAt: now
  };
}

async function fetchFeedItems(feedUrl, source) {
  const response = await fetch(feedUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  const text = await response.text();

  const doc = parseXmlSafe(text);
  if (doc) {
    const rssItems = Array.from(doc.querySelectorAll('item'));
    const atomItems = Array.from(doc.querySelectorAll('entry'));
    const items = [];

    if (rssItems.length) {
      for (const node of rssItems) {
        const parsed = parseRssItem(node, source);
        if (parsed) items.push(parsed);
      }
      return items;
    }
    if (atomItems.length) {
      for (const entry of atomItems) {
        const parsed = parseAtomEntry(entry, source);
        if (parsed) items.push(parsed);
      }
      return items;
    }
  }

  // 回退：无 DOMParser 时用简单正则解析
  return parseWithRegex(text, source);
}

function parseRssItem(node, source) {
  const title = text(node, 'title');
  const link =
    text(node, 'link') || text(node, 'guid') || text(node, 'dc\\:identifier');
  if (!title && !link) return null;

  const description =
    text(node, 'description') || text(node, 'content\\:encoded') || '';
  const dateValue =
    text(node, 'pubDate') ||
    text(node, 'dc\\:date') ||
    text(node, 'date') ||
    '';

  return baseArticle({
    title,
    link,
    source,
    description,
    publishedAt: parseDate(dateValue)
  });
}

function parseAtomEntry(entry, source) {
  const title = text(entry, 'title');
  const linkNode = entry.querySelector('link[rel="alternate"]') || entry.querySelector('link');
  const link = linkNode ? linkNode.getAttribute('href') : '';
  const summary = text(entry, 'summary') || text(entry, 'content') || '';
  const dateValue =
    text(entry, 'updated') || text(entry, 'published') || text(entry, 'created');

  if (!title && !link) return null;

  return baseArticle({
    title,
    link,
    source,
    description: summary,
    publishedAt: parseDate(dateValue)
  });
}

function baseArticle({
  title = '',
  link = '',
  source,
  description = '',
  publishedAt
}) {
  const cleanLink = link || source.pageUrl;
  const id = hashString(cleanLink || title);
  return {
    id,
    title: title.trim() || cleanLink,
    link: cleanLink,
    summary: trimSummary(description),
    content: stripTags(description),
    sourceId: source.id,
    sourceName: source.name,
    publishedAt: publishedAt || Date.now(),
    isFavorite: false,
    isRead: false,
    tags: [],
    createdAt: Date.now()
  };
}

function trimSummary(text) {
  const clean = stripTags(text).replace(/\s+/g, ' ').trim();
  return clean.length > 180 ? `${clean.slice(0, 180)}...` : clean;
}

function stripTags(text = '') {
  return text.replace(/<[^>]*>/g, '');
}

function text(node, selector) {
  const el = node.querySelector(selector);
  return el?.textContent?.trim() ?? '';
}

function parseDate(value) {
  if (!value) return Date.now();
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
}

async function detectFeedFromPage(source) {
  if (typeof DOMParser === 'undefined') return '';
  if (!source.pageUrl) return '';
  try {
    const res = await fetch(source.pageUrl, { cache: 'no-store' });
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const link =
      doc.querySelector('link[type="application/rss+xml"]') ||
      doc.querySelector('link[type="application/atom+xml"]');
    if (link?.getAttribute('href')) {
      return new URL(link.getAttribute('href'), source.pageUrl).href;
    }
  } catch (error) {
    console.warn('探测 RSS 失败', source.pageUrl, error);
  }
  return '';
}

function mergeArticles(existing = [], incoming = []) {
  const map = new Map();
  for (const item of existing) {
    map.set(item.id, item);
  }
  for (const article of incoming) {
    const prev = map.get(article.id);
    const merged = {
      ...article,
      isFavorite: prev?.isFavorite ?? false,
      isRead: prev?.isRead ?? false,
      tags: prev?.tags ?? []
    };
    if (!prev || merged.publishedAt >= (prev.publishedAt ?? 0)) {
      map.set(article.id, merged);
    }
  }
  return Array.from(map.values());
}

function sortArticles(list = []) {
  return [...list].sort(
    (a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0)
  );
}

async function updateBadge(unread, settings) {
  if (!chrome.action || settings.unreadBadge === false) return;
  chrome.action.setBadgeBackgroundColor({ color: '#1E88E5' });
  const text = unread > 0 ? String(Math.min(unread, MAX_BADGE)) : '';
  chrome.action.setBadgeText({ text });
}

async function notifyNewArticles(count, reason, intervalHours) {
  if (!chrome.notifications) return;
  const title = `非遗文创资讯更新 (${count})`;
  const context =
    reason === 'manual'
      ? '手动刷新完成'
      : `已自动完成 ${intervalHours || DEFAULT_SETTINGS.updateIntervalHours} 小时更新`;
  chrome.notifications.create('', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message: `${context}，新增 ${count} 篇。`,
    priority: 1
  });
}

async function toggleFavorite(id) {
  const { articles } = await getState();
  const updated = articles.map((item) =>
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );
  await saveArticles(updated);
  return { ok: true, articles: sortArticles(updated) };
}

async function markRead(id) {
  const { articles } = await getState();
  const updated = articles.map((item) =>
    item.id === id ? { ...item, isRead: true } : item
  );
  await saveArticles(updated);
  return { ok: true, articles: sortArticles(updated) };
}

async function toggleRead(id) {
  const { articles } = await getState();
  const updated = articles.map((item) =>
    item.id === id ? { ...item, isRead: !item.isRead } : item
  );
  await saveArticles(updated);
  return { ok: true, articles: sortArticles(updated) };
}

async function createTag(name) {
  const value = String(name ?? '').trim();
  if (!value) {
    throw new Error('标签名称不能为空');
  }
  const { tags } = await getState();
  const exists = tags.some((tag) => tag.name === value);
  if (exists) {
    throw new Error('标签已存在');
  }
  const baseId = slugify(value) || `tag-${Date.now()}`;
  const hasSameId = tags.some((tag) => tag.id === baseId);
  const id = hasSameId ? `${baseId}-${Date.now()}` : baseId;
  const next = [
    ...tags,
    {
      id,
      name: value,
      createdAt: Date.now()
    }
  ];
  await saveTags(next);
  return { ok: true, tags: next };
}

async function renameTag(id, name) {
  const tagId = String(id ?? '').trim();
  const value = String(name ?? '').trim();
  if (!tagId) {
    throw new Error('标签不存在');
  }
  if (!value) {
    throw new Error('标签名称不能为空');
  }
  const { tags } = await getState();
  const target = tags.find((tag) => tag.id === tagId);
  if (!target) {
    throw new Error('标签不存在');
  }
  const duplicated = tags.some(
    (tag) => tag.id !== tagId && tag.name === value
  );
  if (duplicated) {
    throw new Error('标签名称已存在');
  }
  const next = tags.map((tag) =>
    tag.id === tagId ? { ...tag, name: value } : tag
  );
  await saveTags(next);
  return { ok: true, tags: next };
}

async function toggleArticleTag(articleId, tagId) {
  const id = String(articleId || '');
  const tag = String(tagId || '');
  if (!id || !tag) {
    throw new Error('缺少必要参数');
  }
  const { articles, tags } = await getState();
  if (!tags.some((item) => item.id === tag)) {
    throw new Error('标签不存在');
  }
  let found = false;
  const updated = articles.map((article) => {
    if (article.id !== id) {
      return article;
    }
    found = true;
    const currentTags = Array.isArray(article.tags) ? article.tags : [];
    const hasTag = currentTags.includes(tag);
    const nextTags = hasTag
      ? currentTags.filter((value) => value !== tag)
      : [...currentTags, tag];
    return { ...article, tags: nextTags };
  });
  if (!found) {
    throw new Error('资讯不存在或已删除');
  }
  const sorted = sortArticles(updated);
  await saveArticles(sorted);
  return { ok: true, articles: sorted };
}

async function deleteTag(id) {
  const tagId = String(id ?? '').trim();
  if (!tagId) {
    throw new Error('标签不存在');
  }
  const { tags, articles } = await getState();
  if (!tags.some((tag) => tag.id === tagId)) {
    throw new Error('标签不存在');
  }
  const nextTags = tags.filter((tag) => tag.id !== tagId);
  const updatedArticles = articles.map((article) => {
    const current = Array.isArray(article.tags) ? article.tags : [];
    return current.includes(tagId)
      ? { ...article, tags: current.filter((value) => value !== tagId) }
      : article;
  });
  const sorted = sortArticles(updatedArticles);
  await saveTags(nextTags);
  await saveArticles(sorted);
  return { ok: true, tags: nextTags, articles: sorted };
}

async function addSource(payload = {}) {
  const { sources } = await getState();
  const id = slugify(payload.name || payload.feedUrl || `source-${Date.now()}`);
  const next = [
    ...sources,
    {
      id,
      name: payload.name || id,
      feedUrl: payload.feedUrl || '',
      pageUrl: payload.pageUrl || payload.feedUrl || '',
      enabled: true,
      tags: payload.tags || []
    }
  ];
  await saveSources(next);
  return { ok: true, sources: next };
}

async function updateSource(id, payload = {}) {
  const { sources } = await getState();
  const next = sources.map((item) =>
    item.id === id ? { ...item, ...payload } : item
  );
  await saveSources(next);
  return { ok: true, sources: next };
}

async function removeSource(id) {
  const { sources } = await getState();
  const next = sources.filter((s) => s.id !== id);
  await saveSources(next);
  return { ok: true, sources: next };
}

async function changeSettings(payload = {}) {
  const { settings } = await getState();
  const merged = { ...DEFAULT_SETTINGS, ...settings, ...payload };
  await saveSettings(merged);
  await scheduleAutoUpdate(merged.updateIntervalHours);
  return { ok: true, settings: merged };
}

async function scheduleAutoUpdate(hours = DEFAULT_SETTINGS.updateIntervalHours) {
  const minutes = Math.max(MIN_INTERVAL_MINUTES, Number(hours) * 60);
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(ALARM_NAME, { periodInMinutes: minutes });
}

function parseXmlSafe(text) {
  if (typeof DOMParser === 'undefined') return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    if (doc.querySelector('parsererror')) return null;
    return doc;
  } catch (_e) {
    return null;
  }
}

function parseWithRegex(xmlText = '', source) {
  const items = [];
  const itemBlocks = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];
  const entryBlocks = xmlText.match(/<entry[\s\S]*?<\/entry>/gi) || [];

  if (itemBlocks.length) {
    for (const block of itemBlocks) {
      const title = extractText(block, 'title');
      const link =
        extractText(block, 'link') || extractText(block, 'guid') || '';
      const description =
        extractText(block, 'description') ||
        extractText(block, 'content:encoded') ||
        '';
      const dateValue =
        extractText(block, 'pubDate') ||
        extractText(block, 'dc:date') ||
        extractText(block, 'date');
      if (!title && !link) continue;
      items.push(
        baseArticle({
          title,
          link,
          source,
          description,
          publishedAt: parseDate(dateValue)
        })
      );
    }
    return items;
  }

  for (const block of entryBlocks) {
    const title = extractText(block, 'title');
    const link =
      extractAttr(block, 'link', 'href') || extractText(block, 'link');
    const summary = extractText(block, 'summary') || extractText(block, 'content');
    const dateValue =
      extractText(block, 'updated') ||
      extractText(block, 'published') ||
      extractText(block, 'created');
    if (!title && !link) continue;
    items.push(
      baseArticle({
        title,
        link,
        source,
        description: summary,
        publishedAt: parseDate(dateValue)
      })
    );
  }
  return items;
}

function extractText(block, tag) {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(
    block
  );
  return match ? stripTags(match[1]).trim() : '';
}

function extractAttr(block, tag, attr) {
  const match = new RegExp(`<${tag}[^>]*${attr}=['"]([^'"]+)['"][^>]*>`, 'i').exec(
    block
  );
  return match ? match[1].trim() : '';
}

function hashString(input = '') {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `a-${Math.abs(hash)}`;
}

function slugify(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || `source-${Date.now()}`;
}


