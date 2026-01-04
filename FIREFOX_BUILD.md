# Firefox 插件打包说明

## 如何打包 Firefox 插件

### 方法 1: 使用 Windows 资源管理器打包

1. 选中以下文件和文件夹：
   - `manifest.json`
   - `icons/` 文件夹
   - `src/` 文件夹

2. 右键点击 → 发送到 → 压缩文件夹（或使用 7-Zip/WinRAR）

3. 将生成的 zip 文件命名为 `ancient-chinese-art-rss-firefox.zip`

### 方法 2: 使用命令行打包

在项目根目录运行以下命令：

```powershell
# 创建 Firefox 插件包
Compress-Archive -Path manifest.json,icons,src -DestinationPath ancient-chinese-art-rss-firefox.zip -Force
```

## 如何在 Firefox 中安装

### 临时安装（用于开发测试）

1. 打开 Firefox 浏览器
2. 在地址栏输入 `about:debugging`
3. 点击左侧的 "此 Firefox"
4. 点击 "临时载入附加组件"
5. 选择项目文件夹中的 `manifest.json` 文件
6. 插件即可临时加载（重启浏览器后会失效）

### 永久安装

1. 打开 Firefox 浏览器
2. 在地址栏输入 `about:addons`
3. 点击右上角的齿轮图标
4. 选择 "从文件安装附加组件"
5. 选择打包好的 `ancient-chinese-art-rss-firefox.zip` 文件
6. 按照提示完成安装

**注意**：未签名的扩展在正式版 Firefox 中无法永久安装，需要：
- 使用 Firefox Developer Edition 或 Nightly 版本
- 或者在 `about:config` 中设置 `xpinstall.signatures.required` 为 `false`（不推荐）
- 或者提交到 Firefox 附加组件商店进行审核和签名

## 文件说明

- `manifest.json` - Firefox 插件配置文件（Manifest V2 版本）
- `src/background-firefox.js` - Firefox 专用后台脚本（不使用 ES6 模块）
- `src/browser-polyfill-mini.js` - 浏览器 API 兼容层
- 其他文件与 Chrome 版本共享

## Chrome 版本与 Firefox 版本的区别

1. **Manifest 版本**：
   - Chrome: Manifest V3（使用 Service Worker）
   - Firefox: Manifest V2（使用传统后台脚本）

2. **后台脚本**：
   - Chrome: `src/background.js`（ES6 模块）
   - Firefox: `src/background-firefox.js`（普通脚本）

3. **API 命名**：
   - Chrome: `chrome.*` API
   - Firefox: `browser.*` API（通过 polyfill 兼容）

4. **权限配置**：
   - Chrome: 分离的 `permissions` 和 `host_permissions`
   - Firefox: 合并在 `permissions` 中

## 如何创建 Chrome 版本

如果需要为 Chrome 打包，请修改 `manifest.json`：

1. 将 `manifest_version` 改为 `3`
2. 将 `browser_action` 改为 `action`
3. 将 `background.scripts` 改为 `background.service_worker`
4. 分离 `permissions` 和 `host_permissions`

或者保留一个单独的 `manifest-chrome.json` 文件。

