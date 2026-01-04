# 🔧 修复 Mozilla 验证错误指南

## 问题原因

错误：`Invalid file name in archive: icons\icon.jpg`

**原因：**
1. ❌ Windows 使用反斜杠 `\`，但 Mozilla 要求正斜杠 `/`
2. ❌ 包含了 manifest.json 中未使用的文件（icon.jpg, icon.png）

## ✅ 解决方案

### 方案 1：使用提供的脚本（推荐）

已为您创建好的插件包：`ancient-chinese-art-rss-firefox.zip`

运行以下命令重新生成（已删除多余文件）：
```powershell
.\build-firefox.ps1
```

### 方案 2：手动创建 ZIP（100%可靠）

如果脚本仍有问题，请按以下步骤手动创建：

#### 使用 7-Zip（推荐）

1. **下载 7-Zip**（如果没有）
   - https://www.7-zip.org/

2. **选择文件**
   - 选中以下文件/文件夹：
     - `manifest.json`
     - `icons` 文件夹（只包含 icon16.png, icon48.png, icon128.png）
     - `src` 文件夹

3. **创建压缩包**
   - 右键 → 7-Zip → "添加到压缩包..."
   - 压缩包格式：**zip**
   - 压缩包名称：`ancient-chinese-art-rss-firefox.zip`
   - 点击"确定"

#### 使用 WinRAR

1. 选择文件（同上）
2. 右键 → "添加到压缩文件..."
3. 压缩文件格式：**ZIP**
4. 压缩文件名：`ancient-chinese-art-rss-firefox.zip`
5. 点击"确定"

#### 使用 Windows 资源管理器

1. 选择文件（同上）
2. 右键 → "发送到" → "压缩(zipped)文件夹"
3. 重命名为：`ancient-chinese-art-rss-firefox.zip`

⚠️ **注意**：Windows 自带压缩可能仍有路径问题，建议使用 7-Zip 或 WinRAR

---

## 📋 必须包含的文件清单

```
ancient-chinese-art-rss-firefox.zip
├── manifest.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── background-firefox.js
    ├── browser-polyfill-mini.js
    ├── popup.html
    ├── popup.js
    ├── popup.css
    ├── newtab.html
    ├── newtab.js
    └── styles.css
```

**不要包含：**
- ❌ `icons/icon.jpg`（已删除）
- ❌ `icons/icon.png`（已删除）
- ❌ `src/background.js`（Chrome 版本，不需要）
- ❌ `src/shared/` 文件夹（已内联到 background-firefox.js）
- ❌ 任何 `.html` 测试文件
- ❌ README 或文档文件

---

## 🧪 验证包是否正确

### 方法 1：解压检查

1. 解压 `ancient-chinese-art-rss-firefox.zip` 到新文件夹
2. 检查路径是否使用 `/` 而不是 `\`
3. 确认只包含上述必需文件

### 方法 2：使用命令检查

```powershell
# 列出 ZIP 文件内容
Expand-Archive -Path ancient-chinese-art-rss-firefox.zip -DestinationPath temp-check
Get-ChildItem temp-check -Recurse | Select-Object FullName
Remove-Item temp-check -Recurse
```

---

## 🚀 现在重新上传

1. 访问：https://addons.mozilla.org/developers/addon/submit/distribution
2. 选择 **"On your own"**
3. 上传新的 `ancient-chinese-art-rss-firefox.zip`
4. 应该不再有错误了！ ✅

---

## 🆘 如果仍然有问题

### 最终解决方案：使用 Firefox 直接加载

既然临时加载已经成功，可以先这样使用：

1. 打开 Firefox
2. 访问 `about:debugging`
3. 点击 "此 Firefox"
4. 点击 "临时载入附加组件"
5. 选择项目文件夹中的 `manifest.json`

虽然每次重启需要重新加载，但功能完全正常。

---

## 📝 已完成的修复

- ✅ 删除了 `icons/icon.jpg`
- ✅ 删除了 `icons/icon.png`
- ✅ 创建了新的打包脚本 `build-firefox.ps1`
- ✅ 生成了新的 `ancient-chinese-art-rss-firefox.zip`

现在应该可以成功上传了！

