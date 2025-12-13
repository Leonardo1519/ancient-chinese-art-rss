import {
  DEFAULT_SETTINGS,
  DEFAULT_SOURCES,
  DEFAULT_TAGS,
  STORAGE_KEYS
} from './constants.js';

const read = (keys = []) =>
  new Promise((resolve) => chrome.storage.local.get(keys, resolve));

const write = (values = {}) =>
  new Promise((resolve, reject) => {
    chrome.storage.local.set(values, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(values);
    });
  });

export async function ensureDefaults() {
  const existing = await read([
    STORAGE_KEYS.ARTICLES,
    STORAGE_KEYS.SOURCES,
    STORAGE_KEYS.SETTINGS,
    STORAGE_KEYS.LAST_FETCHED,
    STORAGE_KEYS.TAGS
  ]);

  const updates = {};
  if (!existing[STORAGE_KEYS.SOURCES]) {
    updates[STORAGE_KEYS.SOURCES] = DEFAULT_SOURCES;
  }
  if (!existing[STORAGE_KEYS.SETTINGS]) {
    updates[STORAGE_KEYS.SETTINGS] = DEFAULT_SETTINGS;
  }
  if (!existing[STORAGE_KEYS.ARTICLES]) {
    updates[STORAGE_KEYS.ARTICLES] = [];
  }
  if (!existing[STORAGE_KEYS.TAGS]) {
    updates[STORAGE_KEYS.TAGS] = DEFAULT_TAGS;
  }
  if (Object.keys(updates).length) {
    await write(updates);
  }

  return {
    sources: updates[STORAGE_KEYS.SOURCES] ?? existing[STORAGE_KEYS.SOURCES],
    settings: updates[STORAGE_KEYS.SETTINGS] ?? existing[STORAGE_KEYS.SETTINGS],
    articles: updates[STORAGE_KEYS.ARTICLES] ?? existing[STORAGE_KEYS.ARTICLES],
    lastFetchedAt: existing[STORAGE_KEYS.LAST_FETCHED] ?? null,
    tags: updates[STORAGE_KEYS.TAGS] ?? existing[STORAGE_KEYS.TAGS] ?? DEFAULT_TAGS
  };
}

export async function getState() {
  const data = await read([
    STORAGE_KEYS.ARTICLES,
    STORAGE_KEYS.SOURCES,
    STORAGE_KEYS.SETTINGS,
    STORAGE_KEYS.LAST_FETCHED,
    STORAGE_KEYS.TAGS
  ]);
  return {
    articles: data[STORAGE_KEYS.ARTICLES] ?? [],
    sources: data[STORAGE_KEYS.SOURCES] ?? DEFAULT_SOURCES,
    settings: data[STORAGE_KEYS.SETTINGS] ?? DEFAULT_SETTINGS,
    lastFetchedAt: data[STORAGE_KEYS.LAST_FETCHED] ?? null,
    tags: data[STORAGE_KEYS.TAGS] ?? DEFAULT_TAGS
  };
}

export const saveArticles = (articles = []) =>
  write({ [STORAGE_KEYS.ARTICLES]: articles });

export const saveSources = (sources = []) =>
  write({ [STORAGE_KEYS.SOURCES]: sources });

export const saveSettings = (settings = {}) =>
  write({ [STORAGE_KEYS.SETTINGS]: settings });

export const saveTags = (tags = []) => write({ [STORAGE_KEYS.TAGS]: tags });

export const updateLastFetched = (timestamp) =>
  write({ [STORAGE_KEYS.LAST_FETCHED]: timestamp });

export async function clearAllData() {
  await chrome.storage.local.clear();
  await write({
    [STORAGE_KEYS.SOURCES]: DEFAULT_SOURCES,
    [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
    [STORAGE_KEYS.ARTICLES]: [],
    [STORAGE_KEYS.LAST_FETCHED]: null,
    [STORAGE_KEYS.TAGS]: DEFAULT_TAGS
  });
}


