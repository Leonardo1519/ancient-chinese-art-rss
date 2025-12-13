export const STORAGE_KEYS = {
  ARTICLES: 'articles',
  SOURCES: 'rssSources',
  SETTINGS: 'settings',
  LAST_FETCHED: 'lastFetchedAt',
  TAGS: 'articleTags'
};

export const DEFAULT_SOURCES = [
  {
    id: 'digitaling',
    name: '数英网',
    feedUrl: 'https://www.digitaling.com/rss',
    pageUrl: 'https://www.digitaling.com',
    enabled: true,
    tags: ['创意', '营销']
  },
  {
    id: 'logonews',
    name: '标志情报局',
    feedUrl: 'https://www.logonews.cn/feed',
    pageUrl: 'https://www.logonews.cn',
    enabled: true,
    tags: ['品牌', '设计']
  },
  {
    id: 'meihua',
    name: '梅花网',
    feedUrl: 'https://www.meihua.info/feed',
    pageUrl: 'https://www.meihua.info',
    enabled: true,
    tags: ['营销', '创意']
  },
  {
    id: 'yanko-design',
    name: 'Yanko Design',
    feedUrl: 'https://www.zhisheji.com/feed',
    pageUrl: 'https://www.zhisheji.com',
    enabled: true,
    tags: ['工业设计', '创意']
  },
  {
    id: 'adweek',
    name: 'Adweek',
    feedUrl: 'https://www.adweek.com/feed/',
    pageUrl: 'https://www.adweek.com',
    enabled: true,
    tags: ['广告', '营销']
  },
  {
    id: 'core77',
    name: 'Core77',
    feedUrl: 'https://feeds.feedburner.com/core77/blog',
    pageUrl: 'https://www.core77.com',
    enabled: true,
    tags: ['工业设计']
  },
  {
    id: 'designboom',
    name: 'Designboom',
    feedUrl: 'https://www.designboom.com/feed/',
    pageUrl: 'https://www.designboom.com',
    enabled: true,
    tags: ['设计', '建筑']
  },
  {
    id: 'artnews',
    name: 'Artnews',
    feedUrl: 'https://www.artnews.com/feed/',
    pageUrl: 'https://www.artnews.com',
    enabled: true,
    tags: ['艺术', '新闻']
  },
  {
    id: 'weandthecolor',
    name: 'We and the color',
    feedUrl: 'https://weandthecolor.com/feed',
    pageUrl: 'https://weandthecolor.com',
    enabled: true,
    tags: ['设计', '艺术']
  },
  {
    id: 'colossal',
    name: 'Colossal',
    feedUrl: 'https://www.thisiscolossal.com/feed/',
    pageUrl: 'https://www.thisiscolossal.com',
    enabled: true,
    tags: ['艺术', '创意']
  }
];

export const DEFAULT_SETTINGS = {
  updateIntervalHours: 2,
  notificationsEnabled: true,
  unreadBadge: true,
  openInNewTab: true
};

export const DEFAULT_TAGS = [];


