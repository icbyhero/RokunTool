# 微信分身插件 - 开发文档

## 概述

本插件用于创建和管理多个微信分身应用,所有分身都会被标记,以便其他插件识别。

**设计理念**:
- 分身是独立应用,创建后用户可以直接启动和管理,不需要通过插件控制
- 插件只负责创建和删除分身,不负责进程管理和运行状态监控
- 分身数据完全由微信自己管理,插件不干预用户数据

**自动发现功能**:
- 插件加载时会自动扫描 `~/Applications` 目录
- 找到所有带 `rokun-wechat-instance` 标记的分身
- 自动纳入管理(用于程序重装后恢复配置)
- 避免重复纳入已管理的分身

## 功能列表

### ✅ 已实现功能

#### 核心功能
- ✅ **创建分身** - 基于微信创建多个独立分身
- ✅ **删除分身** - 删除分身及其文件
- ✅ **重建分身** - 微信更新后基于新版本重建分身
- ✅ **自动发现** - 程序重装后自动恢复分身管理

#### 智能功能
- ✅ **版本检测** - 自动检测微信版本更新
- ✅ **版本提示** - 提示用户重建分身以避免兼容性问题
- ✅ **分身标记** - 在 Info.plist 中添加标记,便于其他插件识别
- ✅ **符号链接** - 在 `/Applications` 创建快捷方式,方便访问
- ✅ **中文命名** - 自动将分身命名为"微信3"、"微信4"等

#### 安全功能
- ✅ **权限管理** - 创建/删除/重建时请求必要权限
- ✅ **代码签名** - 自动对分身进行签名,确保可正常运行
- ✅ **配置持久化** - 保存所有分身配置和微信版本信息

#### 工具方法
- ✅ **isWeChatInstance()** - 检查应用是否为微信分身
- ✅ **scanInstances()** - 扫描所有微信分身
- ✅ **getWeChatVersionChange()** - 获取微信版本变化信息
- ✅ **checkWeChatInstalled()** - 检查微信是否安装
- ✅ **getWeChatVersion()** - 获取微信版本号



## 分身标记

每个由本插件创建的微信分身都会在 `Info.plist` 中包含以下标记:

```xml
<key>rokun-wechat-instance</key>
<string>1.0</string>
```

## 分身位置

所有分身创建在: `~/Applications/WeChat*.app`

例如:
- `~/Applications/WeChat3.app`
- `~/Applications/WeChat4.app`
- `~/Applications/WeChat5.app`

## 其他插件如何识别微信分身

### 方法1: 使用静态工具方法 (推荐)

```javascript
const wechatPlugin = require('../wechat-multi-instance/index.js')

// 检查某个应用是否是微信分身
const isInstance = await wechatPlugin.isWeChatInstance('/path/to/app.app')

// 扫描所有微信分身
const instances = await wechatPlugin.scanInstances()
console.log('找到的分身:', instances)
// 输出: ['~/Applications/WeChat3.app', '~/Applications/WeChat4.app']
```

### 方法2: 直接读取 Info.plist

```javascript
const { readFile } = require('fs/promises')
const { join } = require('path')

async function isWeChatInstance(appPath) {
  try {
    const plistPath = join(appPath, 'Contents/Info.plist')
    const content = await readFile(plistPath, 'utf-8')

    // 检查是否包含分身标记
    return content.includes('<key>rokun-wechat-instance</key>')
  } catch (error) {
    return false
  }
}

// 使用示例
const isInstance = await isWeChatInstance('~/Applications/WeChat3.app')
```

### 方法3: 使用 PlistBuddy 命令

```javascript
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

async function isWeChatInstance(appPath) {
  try {
    const plistPath = join(appPath, 'Contents/Info.plist')
    const { stdout } = await execAsync(
      `/usr/libexec/PlistBuddy -c "Print :rokun-wechat-instance" "${plistPath}"`
    )
    return stdout.includes('1.0')
  } catch (error) {
    return false
  }
}
```

## 分身命名规则

- 原始应用: `/Applications/WeChat.app`
- 分身应用: `~/Applications/WeChat3.app`, `WeChat4.app`, `WeChat5.app` ...
- 从 3 开始编号,避免与常见的双开脚本冲突

## Bundle ID 规则

- 原始应用: `com.tencent.xinWeChat`
- 分身应用: `com.tencent.xinWeChat3`, `com.tencent.xinWeChat4`, `com.tencent.xinWeChat5`

## API 导出

```javascript
module.exports = {
  // 生命周期钩子
  onLoad,
  onEnable,
  onDisable,
  onUnload,

  // 实例方法
  createInstance(context),
  deleteInstance(context, instanceId, deleteData),
  rebuildInstance(context, instanceId),
  getInstances(context),
  getInstance(context, instanceId),
  checkWeChatInstalled(context),
  getWeChatVersion(context),
  getWeChatVersionChange(context),

  // 静态工具方法 (供其他插件使用)
  isWeChatInstance(appPath),
  scanInstances()
}
```

### getWeChatVersionChange - 获取版本变化信息

检测微信是否已更新,返回版本变化信息。

**返回值**:
```javascript
{
  oldVersion: '3.9.0',      // 保存的旧版本
  newVersion: '3.9.1',      // 当前新版本
  needsRebuild: true        // 是否需要重建分身
}
```

**使用示例**:
```javascript
const versionChange = await wechatPlugin.getWeChatVersionChange()
if (versionChange && versionChange.needsRebuild) {
  console.log(`微信已更新: ${versionChange.oldVersion} → ${versionChange.newVersion}`)
  console.log('建议重建所有分身以避免兼容性问题')
}
```

### rebuildInstance - 重建分身

用于微信版本更新后,基于新版本的微信重建分身。

**功能**:
- 删除旧的分身文件
- 基于最新的微信版本重新创建分身
- 保留原有的配置(id, 创建时间等)
- 添加 `rebuiltAt` 时间戳

**使用场景**:
```javascript
// 微信更新后,重建所有分身
const instances = await wechatPlugin.getInstances()
for (const instance of instances) {
  await wechatPlugin.rebuildInstance(instance.id)
}
```

## 示例代码

### 扫描并管理所有微信分身

```javascript
const wechatPlugin = require('../wechat-multi-instance/index.js')

async function manageWeChatInstances() {
  // 扫描所有分身
  const instances = await wechatPlugin.scanInstances()

  console.log(`找到 ${instances.length} 个微信分身:`)

  for (const instancePath of instances) {
    const isInstance = await wechatPlugin.isWeChatInstance(instancePath)

    if (isInstance) {
      console.log(`- ${instancePath}`)

      // 你的插件逻辑...
      // 例如: 备份分身配置、清理缓存等
    }
  }
}
```

### 检查特定路径是否为微信分身

```javascript
const wechatPlugin = require('../wechat-multi-instance/index.js')

async function checkApp(appPath) {
  const isInstance = await wechatPlugin.isWeChatInstance(appPath)

  if (isInstance) {
    console.log(`${appPath} 是一个微信分身`)

    // 你的插件逻辑...
  } else {
    console.log(`${appPath} 不是微信分身`)
  }
}
```

## 注意事项

1. **不要直接操作 `/Applications/WeChat.app`**: 这是原始微信应用,应该保持不变
2. **只操作有标记的分身**: 使用 `isWeChatInstance()` 检查,避免误操作其他应用
3. **分身是独立应用**: 用户可以独立启动和退出,不需要通过插件管理
4. **权限管理**: 创建和删除分身需要 `fs:write` 和 `process:exec` 权限

## 不实现的功能列表

以下功能明确**不会实现**,除非用户主动提出需求:

### ❌ 进程监控和状态管理
- **原因**: 分身是独立应用,创建后与插件无关
- **不实现**:
  - 实时监控分身运行状态
  - 自动刷新进程状态
  - 启动/停止分身功能
  - 进程检测和 PID 管理

### ❌ 批量操作
- **原因**: 用户通常一次创建一个分身,批量操作需求不大
- **不实现**:
  - 批量创建分身
  - 批量删除分身
  - 批量启动/停止

### ❌ 分身重命名
- **原因**: 分身名称在创建时确定(微信3, 微信4...),不需要后续修改
- **不实现**:
  - 修改已创建分身的名称
  - 自定义分身名称

### ❌ 数据目录管理
- **原因**: 微信数据由微信自己管理,插件不应干预
- **不实现**:
  - 数据目录备份
  - 数据目录冲突检测
  - 用户数据导入导出
- **已实现**:
  - ✅ 微信更新后的重建提示和一键重建功能

### ❌ 平台兼容性检测
- **原因**: macOS 版本兼容性问题很少,不需要额外检测
- **不实现**:
  - macOS 版本检测和警告
  - Apple Silicon/Intel 架构检测
  - SIP(系统完整性保护)检测

### ❌ 高级 UI 交互
- **原因**: 基础功能已足够,不需要复杂的交互
- **不实现**:
  - 右键上下文菜单
  - 键盘快捷键
  - 操作进度条(创建过程很快,不需要)

### ⚠️ 测试覆盖
- **状态**: 当前未实现测试
- **原因**: 插件功能较简单,手动测试即可
- **说明**: 如果将来需要自动化测试,再由用户提出

### ⚠️ 用户文档
- **状态**: 当前只有开发文档
- **说明**: 如果需要面向最终用户的文档,由用户提出需求

## 可能需要的功能(待定)

以下功能**可能需要**,取决于实际使用场景:

1. **磁盘空间检查** - 创建前检查是否有足够空间
2. **签名验证** - 验证签名是否成功,确保分身可用
3. **错误恢复机制** - 创建失败时的回滚和清理

**说明**: 这些功能只在实际遇到问题时再考虑实现。

## 使用场景

### 场景1: 初次创建分身
1. 用户点击"创建分身"按钮
2. 插件请求权限(文件写入、进程执行)
3. 复制微信应用到 `~/Applications/WeChat3.app`
4. 修改 Bundle ID 和显示名称(微信3)
5. 对应用进行签名
6. 在 `/Applications` 创建符号链接
7. 保存配置到 `instances.json`

### 场景2: 程序重装后自动恢复
1. 用户卸载 RokunTool(配置丢失)
2. 重新安装 RokunTool
3. 插件加载时自动扫描 `~/Applications`
4. 找到 `WeChat3.app`, `WeChat4.app` 等分身
5. 检查 `Info.plist` 中的 `rokun-wechat-instance` 标记
6. 自动将分身纳入管理
7. 恢复配置文件

### 场景3: 删除分身
1. 用户点击"删除"按钮
2. 插件请求权限(文件写入)
3. 删除 `/Applications/WeChat3.app` 符号链接
4. 删除 `~/Applications/WeChat3.app` 实际文件
5. 从配置中移除

### 场景4: 微信更新后重建分身
1. 微信应用自动更新到新版本
2. 插件加载时自动检测版本变化(对比配置文件中保存的版本)
3. 记录版本变化信息(`oldVersion`, `newVersion`, `needsRebuild`)
4. UI 显示警告提示用户重建分身,说明风险:
   - 旧分身可能存在兼容性问题
   - 可能导致数据损坏或功能异常
5. 用户点击"重建"按钮
6. 插件请求权限(文件写入、进程执行)
7. 删除旧的分身文件(保留配置)
8. 基于新版本微信重新创建分身
9. 更新配置,添加 `rebuiltAt` 时间戳
10. 清除版本变化标记
11. 用户可以继续使用新版本分身

**说明**:
- 版本检测在插件加载时自动进行
- 不强制用户重建,只提供提示
- 用户可以选择继续使用旧分身(风险自负)

## 技术实现细节

### 文件结构
```
~/Applications/WeChat3.app     # 实际分身文件(用户目录)
~/Applications/WeChat4.app
/Applications/WeChat3.app       # 符号链接(系统应用目录)
/Applications/WeChat4.app
```

### 配置文件
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

### 分身标记
每个分身的 `Info.plist` 包含:
```xml
<key>rokun-wechat-instance</key>
<string>1.0</string>
```

### 命名规则
- **应用名称**: WeChat3, WeChat4, WeChat5... (从3开始)
- **Bundle ID**: com.tencent.xinWeChat3, com.tencent.xinWeChat4...
- **显示名称**: 微信3, 微信4, 微信5... (中文)

## 设计优势

1. **独立性**: 分身是完全独立的应用,不依赖插件运行
2. **可恢复性**: 程序重装后自动发现并恢复管理
3. **智能性**: 自动检测版本更新并提示用户
4. **安全性**: 权限管理确保用户知情并授权
5. **可识别性**: 分身标记便于其他插件识别
6. **便利性**: 符号链接让用户可以直接从启动台启动

## 完整功能清单

| 功能类别 | 功能名称 | 状态 | 说明 |
|---------|---------|------|------|
| 核心功能 | 创建分身 | ✅ | createInstance() |
| 核心功能 | 删除分身 | ✅ | deleteInstance() |
| 核心功能 | 重建分身 | ✅ | rebuildInstance() |
| 核心功能 | 获取实例列表 | ✅ | getInstances() |
| 核心功能 | 获取单个实例 | ✅ | getInstance() |
| 智能功能 | 自动发现分身 | ✅ | autoDiscoverInstances() |
| 智能功能 | 版本检测 | ✅ | 自动检测微信版本变化 |
| 智能功能 | 版本提示 | ✅ | getWeChatVersionChange() |
| 智能功能 | 分身标记 | ✅ | Info.plist 标记 |
| 智能功能 | 中文命名 | ✅ | modifyWeChatDisplayName() |
| 智能功能 | 符号链接 | ✅ | /Applications 快捷方式 |
| 安全功能 | 权限管理 | ✅ | fs:write, process:exec |
| 安全功能 | 代码签名 | ✅ | signApp() |
| 安全功能 | 配置持久化 | ✅ | instances.json |
| 工具方法 | 检查微信安装 | ✅ | checkWeChatInstalled() |
| 工具方法 | 获取微信版本 | ✅ | getWeChatVersion() |
| 工具方法 | 检查是否分身 | ✅ | isWeChatInstance() |
| 工具方法 | 扫描所有分身 | ✅ | scanInstances() |
| 工具方法 | 获取版本变化 | ✅ | getWeChatVersionChange() |
