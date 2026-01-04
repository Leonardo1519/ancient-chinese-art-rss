# 🔧 解决 "data_collection_permissions" 错误

## 📋 错误信息

```
The "data_collection_permissions" property is missing.
```

## ❓ 这是什么

这不是 manifest.json 的标准字段！这是 Mozilla 在**提交流程中**要求您填写的表单内容，而不是代码问题。

## ✅ 解决方案

### 在提交页面填写隐私信息

当您上传插件时，Mozilla 会有一个表单页面，需要您回答以下问题：

#### 1. **Does this add-on collect user data?** (此插件是否收集用户数据？)
   
   **选择**: ❌ **No** (否)

#### 2. **Data Collection Permissions** (数据收集权限)
   
   **填写**:
   ```
   This extension does not collect, transmit, or share any user data.
   All data (articles, settings, favorites) is stored locally in the user's browser.
   No analytics or tracking is performed.
   ```

#### 3. **Privacy Policy** (隐私政策)
   
   如果要求提供隐私政策URL，您可以：
   
   **选项 A**: 粘贴以下文本
   ```
   Privacy Policy:
   
   This extension does not collect any personal data. All information 
   (RSS feeds, articles, user preferences) is stored locally in your 
   browser and never transmitted to external servers.
   
   Permissions:
   - storage: Store settings locally
   - alarms: Schedule automatic updates
   - notifications: Show new article notifications
   - Host permissions: Fetch RSS feeds from public websites
   
   No tracking, analytics, or data collection occurs.
   ```
   
   **选项 B**: 使用已创建的隐私政策文件
   - 已为您创建: `PRIVACY_POLICY.md`
   - 可以上传到 GitHub 后提供链接

---

## 📝 完整提交流程

### 步骤 1: 上传插件

1. 访问: https://addons.mozilla.org/developers/addon/submit/distribution
2. 选择 **"On your own"**
3. 上传 `ancient-chinese-art-rss-firefox.zip`

### 步骤 2: 填写表单信息

上传后会出现一个表单，填写以下信息：

#### **Add-on Name** (附加组件名称)
```
设计视界 · 思政融新
```

#### **Description** (描述)
```
一站式整合国内外最新设计资讯，自动更新、收藏与提醒。
以思想之光引领设计创新。

功能特点：
- 自动获取多个设计资讯网站的 RSS 订阅
- 本地存储，保护隐私
- 支持收藏、标签管理
- 定时自动更新
- 桌面通知提醒
```

#### **Categories** (分类)
选择:
- **News & Blogs** (新闻与博客)
- **Productivity** (生产力)

#### **Does this add-on collect user data?** (是否收集数据？)
```
❌ No
```

#### **Data Collection Statement** (数据收集声明)
```
This extension does not collect, transmit, or share any user data.
All data is stored locally using browser storage API.
```

#### **Privacy Policy** (隐私政策)
```
This extension respects your privacy:
- No data collection or tracking
- All data stored locally in your browser
- No external servers involved
- Open source code available for review

Permissions explained:
- storage: Local data storage
- alarms: Schedule automatic RSS updates  
- notifications: Show new article alerts
- Host permissions: Fetch RSS feeds from public websites
```

#### **Version Notes** (版本说明 - 可选)
```
Initial release for self-distribution
```

### 步骤 3: 提交审核

点击 **"Submit Version"** 完成提交

---

## ⏰ 等待时间

- **自托管签名**: 通常 5分钟 - 2小时
- **状态检查**: https://addons.mozilla.org/developers/addons

---

## 🎯 关键点

**重要**: `data_collection_permissions` **不是** manifest.json 的字段，而是提交表单中的问题。您需要：

1. ✅ 在表单中回答"不收集数据"
2. ✅ 提供隐私政策说明
3. ✅ 解释每个权限的用途

---

## 📄 已准备的文件

- ✅ `ancient-chinese-art-rss-firefox.zip` - 更新后的插件包
- ✅ `PRIVACY_POLICY.md` - 隐私政策文档
- ✅ `manifest.json` - 已添加 developer 信息

---

## 💡 如果还是不清楚

Mozilla 的提交流程是交互式的，会一步步引导您。当您上传文件后：

1. 如果验证通过，会进入表单页面
2. 按照提示填写信息即可
3. 遇到 "data collection" 相关问题，选择 "No" 并说明不收集数据

---

## 🚀 现在重新上传

新的插件包已生成（39.61 KB），包含了完善的 manifest.json。

立即上传: https://addons.mozilla.org/developers/addon/submit/distribution

祝您成功！🎉

