# 自托管发布指南（Self-distribution）

## 📦 快速获得 Mozilla 签名 - 完整操作流程

自托管发布可以让您在 **几小时内** 获得 Mozilla 官方签名，而无需等待商店审核。

---

## 🎯 步骤 1：注册开发者账号

1. 访问：https://addons.mozilla.org/
2. 点击右上角 **"登录"**
3. 使用 Firefox 账号登录（如没有则注册）
4. 访问开发者中心：https://addons.mozilla.org/developers/

---

## 📝 步骤 2：提交插件进行签名

### 2.1 进入提交页面

1. 在开发者中心，点击 **"Submit a New Add-on"**（提交新附加组件）
2. 或直接访问：https://addons.mozilla.org/developers/addon/submit/distribution

### 2.2 选择分发方式 ⚠️ 重要！

在 **"Where do you want to list your add-on?"** 页面：

**选择第二个选项：**
```
📦 On your own
   - Get your extension signed for self-distribution
   - Not listed on addons.mozilla.org
   - Faster signing process
```

**不要选择：**
```
❌ On this site
   - Listed on addons.mozilla.org
   - Subject to full review (需要完整审核)
```

### 2.3 上传插件包

1. 点击 **"Select a file..."** 或拖拽文件
2. 上传 `ancient-chinese-art-rss-firefox.zip`
3. 等待自动验证（通常几秒钟）

### 2.4 填写基本信息

根据提示填写（信息较少）：

**版本说明**（可选）：
```
首次提交，用于自托管分发
```

**源代码**（如果需要）：
- 我们的代码没有混淆或压缩，通常不需要额外上传
- 如果被要求，可以上传整个项目文件夹的 zip

### 2.5 提交

点击 **"Submit Version"**（提交版本）

---

## ⏰ 步骤 3：等待自动签名

### 审核速度：

| 审核类型 | 时间 |
|---------|------|
| **自动审核**（最常见） | 5分钟 - 2小时 |
| **人工审核**（如果触发） | 几小时 - 1天 |

### 触发人工审核的情况：
- 使用危险权限（如 `proxy`、`nativeMessaging`）
- 代码中有可疑模式
- 第一次提交（但通常也很快）

### 检查状态：

1. 访问：https://addons.mozilla.org/developers/addons
2. 查看您的插件状态
3. 状态显示：
   - 🟡 **Awaiting Review**（等待审核）
   - 🟢 **Approved**（已批准并签名）
   - 🔴 **Rejected**（被拒绝 - 罕见）

---

## ✅ 步骤 4：下载已签名的插件

签名完成后：

1. 在您的附加组件列表中，点击插件名称
2. 进入版本管理页面
3. 找到 **"Download signed file"**（下载已签名文件）
4. 下载 `*.xpi` 文件（这就是已签名的插件）

**文件名示例：**
```
ancient_chinese_art_rss-0.1.0-fx.xpi
```

---

## 📤 步骤 5：分发和安装

### 方式 A：本地安装（最简单）

1. 打开 Firefox
2. 在地址栏输入：`about:addons`
3. 点击右上角 **齿轮图标**
4. 选择 **"从文件安装附加组件"**
5. 选择下载的 `.xpi` 文件
6. 点击 **"添加"** 确认安装
7. ✅ **永久安装成功！**重启浏览器也不会消失

### 方式 B：通过网络分发

**选项 1：直接链接**
```
将 .xpi 文件上传到您的服务器
用户点击链接即可安装
```

**选项 2：GitHub Releases**
```bash
# 1. 在 GitHub 仓库创建 Release
# 2. 上传 .xpi 文件作为附件
# 3. 用户从 Release 页面下载并安装
```

**选项 3：简单 HTML 页面**
```html
<!DOCTYPE html>
<html>
<head>
    <title>设计视界 · 思政融新 - 插件下载</title>
</head>
<body>
    <h1>Firefox 插件下载</h1>
    <a href="ancient_chinese_art_rss-0.1.0-fx.xpi">
        点击安装插件
    </a>
</body>
</html>
```

---

## 🔄 步骤 6：更新插件（未来）

当需要发布新版本时：

1. 修改 `manifest.json` 中的 `version`：
   ```json
   "version": "0.2.0"  // 从 0.1.0 升级
   ```

2. 重新打包：
   ```powershell
   Compress-Archive -Path manifest.json,icons,src -DestinationPath ancient-chinese-art-rss-firefox-v0.2.0.zip -Force
   ```

3. 访问开发者中心
4. 点击您的插件
5. 点击 **"Upload a New Version"**
6. 上传新的 zip 文件
7. 等待自动签名（通常更快，几分钟）
8. 下载新的 `.xpi` 文件

**自动更新：**
- 自托管的插件默认不会自动更新
- 如需自动更新，需要在 manifest.json 中添加 `update_url`
- 或者提示用户手动下载新版本

---

## ⚠️ 注意事项

### 1. 插件 ID 必须保持不变
```json
"browser_specific_settings": {
  "gecko": {
    "id": "ancient-chinese-art-rss@example.com",  // 不要更改
    "strict_min_version": "57.0"
  }
}
```

### 2. 建议使用您自己的域名作为 ID
```json
// 当前：
"id": "ancient-chinese-art-rss@example.com"

// 建议改为（如果您有域名）：
"id": "rss-reader@yourdomain.com"

// 或使用 UUID 格式：
"id": "{12345678-1234-1234-1234-123456789abc}"
```

### 3. 版本号规则
- 必须遵循语义化版本：`major.minor.patch`
- 例如：`0.1.0` → `0.1.1` → `0.2.0` → `1.0.0`
- 每次提交必须递增

### 4. 文件大小限制
- 单个文件最大：200MB
- 通常插件应该 < 5MB

---

## 🆚 自托管 vs 商店发布对比

| 特性 | 自托管 | 商店发布 |
|-----|--------|---------|
| **签名速度** | ⚡ 几分钟-几小时 | 🐢 3-14天 |
| **审核严格度** | 📝 基础自动审核 | 🔍 完整人工审核 |
| **可搜索性** | ❌ 不在商店显示 | ✅ 可被用户搜索 |
| **分发方式** | 🔗 自己提供下载 | 🏪 商店一键安装 |
| **自动更新** | ⚙️ 需手动配置 | ✅ 自动推送 |
| **适合场景** | 内部使用、快速测试 | 公开发布、广泛传播 |

---

## 🎯 推荐流程

**对于您的情况，建议：**

1. **现在**：使用自托管签名
   - 几小时内获得签名
   - 可以永久安装使用
   
2. **未来**（如果需要）：迁移到商店
   - 使用相同的插件 ID
   - 在开发者中心切换分发方式
   - 提交完整审核

这样既能快速使用，又保留了未来上架的可能性！

---

## 📞 遇到问题？

### 常见错误及解决方案

**错误 1：Upload failed - missing id**
```
解决：确保 manifest.json 包含 browser_specific_settings.gecko.id
```

**错误 2：Invalid version**
```
解决：版本号格式必须是 x.y.z（如 0.1.0）
```

**错误 3：Permission requires review**
```
解决：某些权限会触发人工审核，需要多等几小时
```

### 获取帮助

- Mozilla 开发者论坛：https://discourse.mozilla.org/c/add-ons/35
- 文档：https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/

---

## ✨ 准备好了吗？

现在您可以：

1. 访问：https://addons.mozilla.org/developers/addon/submit/distribution
2. 选择 **"On your own"**
3. 上传 `ancient-chinese-art-rss-firefox.zip`
4. 几小时后下载已签名的 `.xpi` 文件
5. 永久安装到 Firefox！

祝您提交顺利！🚀

