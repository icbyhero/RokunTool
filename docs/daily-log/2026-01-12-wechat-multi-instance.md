# 微信分身插件 - 开发日志

## 2026-01-12 - 权限系统集成与功能完善

### 主要工作

#### 1. 权限请求系统集成
- ✅ 适配微信分身插件使用权限请求系统
- ✅ 适配 Rime 配置插件使用权限请求系统
- ✅ 创建/删除分身前请求 `fs:write` 权限
- ✅ 签名操作前请求 `process:exec` 权限

**实现位置**:
- [index.js:128-138](index.js#L128-L138) - 创建分身权限请求
- [index.js:144-154](index.js#L144-L154) - 签名权限请求
- [index.js:313-323](index.js#L313-L323) - 删除分身权限请求

#### 2. 分身文件存储优化
**问题**: 创建在 `/Applications` 需要 sudo 权限
**解决方案**:
- 实际文件存储在 `~/Applications/WeChat*.app` (用户目录,无需 sudo)
- 在 `/Applications/WeChat*.app` 创建符号链接
- 用户可以直接从启动台访问分身

**实现位置**:
- [index.js:14-18](index.js#L14-L18) - 常量定义
- [index.js:158-169](index.js#L158-L169) - 符号链接创建
- [index.js:325-334](index.js#L325-L334) - 符号链接删除

#### 3. 应用签名改进
**问题**: 签名失败 - "unsealed contents present in the bundle root"
**解决方案**: 实现4步签名流程
1. 清除扩展属性 (`xattr -cr`)
2. 移除根目录的未密封文件
3. 签名 Contents 目录
4. 签名整个应用

**实现位置**:
- [index.js:299-337](index.js#L299-L337) - 改进的签名方法

#### 4. 分身命名优化
**需求**: 分身从 WeChat3 开始编号,避免与常见双开脚本冲突
**实现**: `getNextInstanceNumber()` 从 3 开始编号

**实现位置**:
- [index.js:193-199](index.js#L193-L199)

#### 5. 微信显示名称自动修改
**需求**: 分身显示为中文名称"微信3"、"微信4"等
**实现**:
- 修改 `CFBundleDisplayName` 为中文
- 修改 `CFBundleName` 为中文
- 修改 `zh_CN.lproj/InfoPlist.strings` 本地化字符串

**实现位置**:
- [index.js:253-297](index.js#L253-L297) - `modifyWeChatDisplayName()` 方法

#### 6. 分身标记系统
**需求**: 其他插件需要识别哪些是微信分身
**实现**: 在 Info.plist 添加标记
```xml
<key>rokun-wechat-instance</key>
<string>1.0</string>
```

**导出工具方法**:
- `isWeChatInstance(appPath)` - 检查应用是否为分身
- `scanInstances()` - 扫描所有分身

**实现位置**:
- [index.js:237-248](index.js#L237-L248) - 添加标记
- [index.js:506-548](index.js#L506-L548) - 静态工具方法

#### 7. 自动发现功能
**场景**: 程序重装后自动恢复分身管理
**实现**: 插件加载时自动扫描 `~/Applications`
- 查找所有带 `rokun-wechat-instance` 标记的应用
- 自动纳入管理
- 避免重复纳入

**实现位置**:
- [index.js:37-38](index.js#L37-L38) - 调用自动发现
- [index.js:568-629](index.js#L568-L629) - `autoDiscoverInstances()` 方法

#### 8. 分身重建功能
**需求**: 微信更新后,基于新版本重建分身
**实现**:
- 删除旧分身文件(保留配置)
- 基于最新微信版本重新创建
- 保留原有的 `id` 和 `createdAt`
- 添加 `rebuiltAt` 时间戳

**实现位置**:
- [index.js:406-526](index.js#L406-L526) - `rebuildInstance()` 方法

#### 9. 微信版本自动检测
**需求**: 检测微信版本更新并提示用户
**实现**:
- 配置文件保存微信版本号
- 加载时对比版本变化
- 返回版本变化信息供 UI 使用

**实现位置**:
- [index.js:67-81](index.js#L67-L81) - 版本检测逻辑
- [index.js:87-89](index.js#L87-L89) - 版本持久化
- [index.js:674-680](index.js#L674-L680) - `getWeChatVersionChange()` 方法

### 修复的问题

#### Bug 1: 权限对话框点击无效
**症状**: 点击权限对话框没有反应,再次点击仍然弹出
**原因**: IPC 通信机制不匹配
- 渲染进程使用 `ipcRenderer.send('permission:response')`
- 主进程使用 `webContents.on('permission:response')`
- 这是两个不同的通信机制!

**解决方案**: 主进程改用 `ipcMain.on('permission:response')`

**修复位置**:
- [permission-manager.ts:229-260](../../src/main/permissions/permission-manager.ts#L229-L260)
- [handlers.ts:538-540](../../src/main/ipc/handlers.ts#L538-L540) - 添加注释说明
- [App.tsx:62-67](../../src/renderer/src/App.tsx#L62-L67) - 修复监听器清理

#### Bug 2: 进程停止错误
**症状**: 删除分身时提示 "No matching processes"
**原因**: 分身是独立应用,已经不需要通过插件管理进程
**解决方案**: 移除 `startInstance()` 和 `stopInstance()` 方法

**相关讨论**:
- 用户指出:"停止实例失败, 应该不需要有停止的操作,因为一旦运行了,就是独立应用了"

**修复位置**:
- [index.js](index.js) - 移除进程管理相关代码

### API 导出更新

新增导出的方法:
```javascript
module.exports = {
  // ... 生命周期方法
  createInstance(context),
  deleteInstance(context, instanceId, deleteData),
  rebuildInstance(context, instanceId),        // 新增
  getInstances(context),
  getInstance(context, instanceId),
  checkWeChatInstalled(context),
  getWeChatVersion(context),
  getWeChatVersionChange(context),             // 新增

  // 静态工具方法
  isWeChatInstance(appPath),
  scanInstances()
}
```

### 配置文件格式更新

**之前**:
```json
{
  "instances": [...]
}
```

**现在**:
```json
{
  "wechatVersion": "3.9.1",
  "instances": [
    {
      "id": "instance-1234567890",
      "name": "WeChat3",
      "path": "/Applications/WeChat3.app",
      "realPath": "/Users/xxx/Applications/WeChat3.app",
      "bundleId": "com.tencent.xinWeChat3",
      "createdAt": "2026-01-12T10:00:00.000Z",
      "rebuiltAt": "2026-01-12T12:00:00.000Z",
      "running": false,
      "autoDiscovered": false
    }
  ]
}
```

### 文档更新

1. ✅ 更新 README.md - 添加功能列表、使用场景、技术细节
2. ✅ 标注不实现的功能 - 进程监控、批量操作、重命名等
3. ✅ 添加设计理念说明
4. ✅ 添加完整功能清单
5. ✅ 添加使用场景文档

### 技术亮点

1. **符号链接方案**: 巧妙解决权限问题,用户目录存储 + 系统目录快捷方式
2. **分身标记系统**: 让分身可识别,便于其他插件集成
3. **自动发现机制**: 程序重装后自动恢复,用户体验友好
4. **版本检测**: 智能检测微信更新,主动提示用户重建
5. **保留配置重建**: 重建时保留所有历史配置,不丢失数据
6. **权限系统集成**: 完整集成权限请求,用户明确授权

### 测试要点

- [ ] 创建分身 - 应弹出权限请求
- [ ] 删除分身 - 应弹出权限请求
- [ ] 符号链接 - /Applications 应有快捷方式
- [ ] 中文命名 - Finder 和启动台显示"微信3"
- [ ] 自动发现 - 删除配置后重装应自动恢复
- [ ] 版本检测 - 微信更新后应提示重建
- [ ] 重建分身 - 保留 id 和 createdAt
- [ ] 分身标记 - 其他插件可识别分身

### 已知限制

1. **不需要 sudo**: 创建在 ~/Applications,不需要管理员权限
2. **分身是独立应用**: 创建后与插件无关,用户直接管理
3. **不管理数据**: 微信数据由微信自己管理,插件不干预
4. **不批量操作**: 每次操作一个分身,不支持批量创建/删除
5. **不重命名**: 分身名称创建时确定,后续不修改

### 后续优化方向(待定)

1. **磁盘空间检查** - 创建前检查是否有足够空间
2. **签名验证** - 验证签名是否成功,确保分身可用
3. **错误恢复机制** - 创建失败时的回滚和清理

**说明**: 这些功能只在实际遇到问题时再考虑实现。

---

## 开发时间线

### 2026-01-12 上午
- 适配微信和 Rime 插件使用权限请求系统
- 修复权限对话框点击无效的 Bug
- 优化分身文件存储位置(~/Applications)
- 改进应用签名流程

### 2026-01-12 下午
- 移除进程管理功能(按用户反馈)
- 添加分身标记系统
- 实现自动发现功能
- 添加分身重建功能
- 实现微信版本自动检测
- 修改微信显示名称为中文名
- 创建符号链接机制

### 2026-01-12 晚上
- 完善文档
- 添加功能清单
- 整理使用场景
- 标注不实现的功能

---

## 相关文件

### 插件核心
- [index.js](index.js) - 插件主文件
- [README.md](README.md) - 开发文档
- [CHANGELOG.md](CHANGELOG.md) - 本文档

### 系统集成
- [../../src/main/plugins/loader.ts](../../src/main/plugins/loader.ts) - 插件加载器
- [../../src/main/permissions/permission-manager.ts](../../src/main/permissions/permission-manager.ts) - 权限管理器
- [../../src/main/ipc/handlers.ts](../../src/main/ipc/handlers.ts) - IPC 处理器
- [../../src/preload/ipc.ts](../../src/preload/ipc.ts) - Preload API
- [../../src/renderer/src/App.tsx](../../src/renderer/src/App.tsx) - 渲染进程

### 文档规范
- [../../../openspec/specs/wechat-multi-instance/spec.md](../../../openspec/specs/wechat-multi-instance/spec.md) - 功能规范
- [../../../openspec/AGENTS.md](../../../openspec/AGENTS.md) - OpenSpec 指南
