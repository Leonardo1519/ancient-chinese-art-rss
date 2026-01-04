// 简单的 browser polyfill，让 Chrome API 在 Firefox 中也能工作
if (typeof chrome === 'undefined' && typeof browser !== 'undefined') {
  window.chrome = browser;
}

