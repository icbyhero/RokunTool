# 微信分身插件技术文档

## 🏗️ 插件架构

### 整体设计

微信分身插件采用事件驱动架构,通过RokunTool的插件API实现以下核心功能:

```
┌─────────────────────────────────────────┐
│         RokunTool 主应用                │
│  ┌───────────────────────────────────┐  │
│  │      插件生命周期管理             │  │
│  │  - onLoad() 加载插件              │  │
│  │  - onEnable() 启用插件            │  │
│  │  - onDisable() 禁用插件           │  │
│  │  - onUnload() 卸载插件            │  │
│  └───────────────────────────────────┘  │
│                 ↑↓                       │
│  ┌───────────────────────────────────┐  │
│  │      WeChatMultiInstancePlugin    │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   实例管理器                 │  │  │
│  │  │   - 创建实例                 │  │  │
│  │  │   - 启动/停止实例            │  │  │
│  │  │   - 删除实例                 │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   配置管理器                 │  │  │
│  │  │   - 加载配置                 │  │  │
│  │  │   - 保存配置                 │  │  │
│  │  │   - 实例持久化               │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Shell命令执行器            │  │  │
│  │  │   - 应用复制                 │  │  │
│  │  │   - Bundle ID修改            │  │  │
│  │  │   - 代码签名                 │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 核心组件

#### 1. 插件主类 (WeChatMultiInstancePlugin)

```javascript
class WeChatMultiInstancePlugin {
  constructor(context)            // 构造函数,初始化插件
  async onLoad(context)           // 加载钩子
  async onEnable(context)         // 启用钩子
  async onDisable(context)        // 禁用钩子
  async onUnload(context)         // 卸载钩子

  // 核心方法
  async createInstance(name)      // 创建新实例
  async deleteInstance(id)        // 删除实例
  async startInstance(id)         // 启动实例
  async stopInstance(id)          // 停止实例
  async getInstanceStatus(id)     // 获取实例状态
}
```

#### 2. 实例管理器

负责管理所有微信实例的生命周期:

**数据结构**:
```javascript
{
  id: string,                    // 实例唯一标识
  name: string,                  // 实例显示名称
  path: string,                  // 应用路径
  bundleId: string,              // Bundle ID
  status: 'running' | 'stopped', // 运行状态
  pid: number | null,            // 进程ID
  createdAt: string,             // 创建时间
  updatedAt: string              // 更新时间
}
```

**状态机**:
```
     [创建]
        ↓
    [stopped] ──→ [running] ──→ [stopped]
        ↓              ↑
     [删除] ←──────────┘
```

#### 3. 配置管理器

负责持久化实例配置:

**配置文件位置**:
```
~/Library/Application Support/RokunTool/plugins/wechat-multi-instance/instances.json
```

**配置结构**:
```json
{
  "version": "1.0.0",
  "instances": [
    {
      "id": "uuid-1",
      "name": "工作号",
      "path": "/Applications/WeChat-工作号.app",
      "bundleId": "com.tencent.xin.work",
      "status": "stopped",
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-10T10:00:00Z"
    }
  ]
}
```

## 🔧 Shell脚本封装设计

### 命令执行策略

插件使用Node.js的`child_process`模块执行Shell命令,采用以下策略:

#### 1. 同步命令 (使用exec)

适用于快速操作(如检查文件、获取信息):

```javascript
const { execSync } = require('child_process')

// 检查应用是否存在
function appExists(path) {
  try {
    execSync(`test -d "${path}"`)
    return true
  } catch {
    return false
  }
}

// 获取Bundle ID
function getBundleId(path) {
  const stdout = execSync(
    `/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "${path}/Contents/Info.plist"`
  ).toString()
  return stdout.trim()
}
```

#### 2. 异步命令 (使用spawn)

适用于长时间运行的操作(如复制文件、签名):

```javascript
const { spawn } = require('child_process')

// 复制应用
function copyApp(source, target) {
  return new Promise((resolve, reject) => {
    const process = spawn('cp', ['-R', source, target])

    process.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Copy failed with code ${code}`))
    })

    process.on('error', reject)
  })
}

// 签名应用
function signApp(path) {
  return new Promise((resolve, reject) => {
    const process = spawn('sudo', [
      'codesign',
      '--force',
      '--deep',
      '--sign',
      '-',
      path
    ])

    process.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Codesign failed with code ${code}`))
    })

    process.on('error', reject)
  })
}
```

### 关键命令详解

#### 1. 应用复制

```bash
# 复制微信应用
cp -R /Applications/WeChat.app /Applications/WeChat-{name}.app
```

**说明**:
- `-R`: 递归复制整个目录
- 保持权限和时间戳
- 创建独立的副本

#### 2. Bundle ID修改

```bash
# 读取Info.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" WeChat.app/Contents/Info.plist

# 修改Bundle ID
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.tencent.xin.{name}" WeChat-{name}.app/Contents/Info.plist

# 修改显示名称
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName WeChat {name}" WeChat-{name}.app/Contents/Info.plist

# 修改Bundle名称
/usr/libexec/PlistBuddy -c "Set :CFBundleName WeChat {name}" WeChat-{name}.app/Contents/Info.plist
```

**Bundle ID命名规则**:
- 原版: `com.tencent.xin`
- 分身: `com.tencent.xin.{suffix}`
- 示例:
  - `com.tencent.xin.work` (工作号)
  - `com.tencent.xin.personal` (个人号)

#### 3. 应用签名

```bash
# 签名应用
sudo codesign --force --deep --sign - /Applications/WeChat-{name}.app

# 验证签名
codesign --verify --verbose /Applications/WeChat-{name}.app

# 显示签名信息
codesign --display --entitlements - /Applications/WeChat-{name}.app
```

**签名参数说明**:
- `--force`: 强制重新签名,即使已签名
- `--deep`: 递归签名所有子组件
- `--sign -`: 使用ad-hoc签名(不使用证书)
- `--verify`: 验证签名有效性

**为什么使用ad-hoc签名?**
- macOS允许本地开发使用ad-hoc签名
- 不需要Apple Developer账号
- 适用于个人使用场景
- 可以在本地正常运行

#### 4. 进程管理

```bash
# 启动应用
open /Applications/WeChat-{name}.app

# 后台启动
open -g /Applications/WeChat-{name}.app

# 查找进程
pgrep -f "WeChat-{name}"

# 获取进程ID
pgrep -f "WeChat-{name}" | head -n 1

# 终止进程
kill $(pgrep -f "WeChat-{name}")

# 强制终止
killall -9 "WeChat-{name}"
```

## 🔐 权限要求说明

### 必需权限

插件需要以下系统权限:

#### 1. 文件系统权限

**用途**:
- 读取 `/Applications/WeChat.app`
- 复制应用到 `/Applications/`
- 修改 `Info.plist` 文件
- 读写配置目录

**实现**:
```javascript
// 读取文件
const data = await readFile(path, 'utf-8')

// 写入文件
await writeFile(path, data, 'utf-8')

// 检查文件存在
await access(path, fs.constants.R_OK | fs.constants.W_OK)

// 创建目录
await mkdir(dir, { recursive: true })
```

#### 2. 进程管理权限

**用途**:
- 启动微信应用
- 监控进程状态
- 终止进程

**实现**:
```javascript
// 启动进程
const process = spawn('open', [appPath])

// 获取进程ID
const pid = await execAsync(`pgrep -f "${appName}"`)

// 终止进程
await execAsync(`kill ${pid}`)
```

#### 3. Shell执行权限

**用途**:
- 执行系统命令
- 修改系统文件
- 执行签名操作

**实现**:
```javascript
// 执行命令
const result = await execAsync(command)

// 带权限的命令
const result = await execAsync(`sudo ${command}`)
```

#### 4. 通知权限

**用途**:
- 显示操作结果
- 错误提示
- 状态通知

**实现**:
```javascript
// 显示通知
await context.api.ui.showNotification('创建成功', '微信分身已创建')
```

### 权限申请流程

```
用户创建分身
    ↓
检查权限
    ↓
缺少权限? ──Yes→ 弹出权限请求对话框
    ↓No                   ↓
执行操作             用户授权
    ↓                    ↓
完成 ←─────────────────┘
```

### 权限配置

在插件的 `package.json` 中声明权限:

```json
{
  "rokun": {
    "permissions": [
      "fs:read",        // 文件读取
      "fs:write",       // 文件写入
      "process:spawn",  // 启动进程
      "process:exec",   // 执行命令
      "process:kill",   // 终止进程
      "shell:execute",  // Shell执行
      "notification:show" // 显示通知
    ]
  }
}
```

## 🍎 macOS签名机制说明

### 什么是代码签名?

代码签名是macOS的安全机制,用于:
- 验证应用来源
- 确保应用完整性
- 防止篡改
- 控制应用权限

### 签名的层级

```
应用
  ├── 框架
  │   └── .dylib
  ├── 动态库
  │   └── .dylib
  ├── 可执行文件
  │   └── WeChat
  └── 资源文件
```

每个层级都需要签名:
1. **可执行文件**: Mach-O二进制文件
2. **动态库**: .dylib文件
3. **框架**: .framework
4. **应用包**: .app整个包

### 签名类型

#### 1. 开发者签名

- 需要Apple Developer账号
- 使用开发者证书签名
- 可以分发到App Store
- 适合公开发布的应用

#### 2. Ad-hoc签名(自签名)

- 不需要证书
- 用于本地开发
- 不能分发
- **本插件使用的签名方式**

### 本插件的签名策略

#### 为什么使用ad-hoc签名?

1. **无需证书**: 不需要Apple Developer账号
2. **本地运行**: 仅在本地使用,不分发
3. **简单快捷**: 一条命令即可完成
4. **合法合规**: 符合macOS本地开发规范

#### 签名流程

```bash
# 1. 复制应用
cp -R /Applications/WeChat.app /Applications/WeChat-{name}.app

# 2. 修改Bundle ID
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.tencent.xin.{name}" \
  WeChat-{name}.app/Contents/Info.plist

# 3. 递归签名
sudo codesign --force --deep --sign - /Applications/WeChat-{name}.app

# 4. 验证签名
codesign --verify --verbose /Applications/WeChat-{name}.app
```

#### 签名验证

```bash
# 验证签名
codesign --verify --verbose /Applications/WeChat-{name}.app

# 输出: /Applications/WeChat-{name}.app: valid on disk
#       /Applications/WeChat-{name}.app: satisfies its Designated Requirement

# 查看签名信息
codesign --display -r - /Applications/WeChat-{name}.app

# 输出: designated => identifier "com.tencent.xin.{name}"
```

### 签名相关错误处理

#### 错误1: code object is not signed

**原因**: 应用未签名或签名损坏

**解决**:
```bash
sudo codesign --force --deep --sign - /Applications/WeChat-{name}.app
```

#### 错误2: code signature invalid

**原因**: 签名与应用不匹配

**解决**:
```bash
# 删除扩展属性
xattr -cr /Applications/WeChat-{name}.app

# 重新签名
sudo codesign --force --deep --sign - /Applications/WeChat-{name}.app
```

#### 错误3: bundle format unrecognized

**原因**: 应用结构损坏

**解决**:
```bash
# 重建应用
rm -rf /Applications/WeChat-{name}.app
# 重新创建分身
```

## 🔍 调试和日志

### 日志系统

插件使用RokunTool的日志API:

```javascript
// 记录信息
context.logger.info('创建分身中...')

// 记录警告
context.logger.warn('应用已存在')

// 记录错误
context.logger.error('创建失败', error)
```

### 日志文件位置

```
~/Library/Logs/RokunTool/wechat-multi-instance.log
```

### 调试技巧

#### 1. 查看实时日志

```bash
tail -f ~/Library/Logs/RokunTool/wechat-multi-instance.log
```

#### 2. 检查进程状态

```bash
# 查看所有微信进程
ps aux | grep -i wechat

# 查看特定分身进程
pgrep -lf "WeChat-工作号"
```

#### 3. 验证应用状态

```bash
# 检查应用是否存在
ls -la /Applications/WeChat-*.app

# 查看Bundle ID
defaults read /Applications/WeChat-工作号.app/Contents/Info.plist CFBundleIdentifier

# 验证签名
codesign -dv /Applications/WeChat-工作号.app 2>&1 | grep -E "Identifier|Authority"
```

#### 4. 测试命令

```bash
# 测试复制
cp -R /Applications/WeChat.app /tmp/WeChat-test.app

# 测试签名
sudo codesign --force --deep --sign - /tmp/WeChat-test.app

# 测试启动
open /tmp/WeChat-test.app

# 清理
rm -rf /tmp/WeChat-test.app
```

## 📊 性能优化

### 内存管理

1. **延迟加载**: 只在需要时加载实例列表
2. **缓存状态**: 避免频繁的进程查询
3. **清理资源**: 及时释放不需要的资源

### 并发控制

```javascript
// 限制并发操作
const MAX_CONCURRENT = 3
const queue = []

async function executeWithLimit(operation) {
  while (queue.length >= MAX_CONCURRENT) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  queue.push(operation)
  try {
    return await operation()
  } finally {
    queue.shift()
  }
}
```

### 错误重试

```javascript
async function retry(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

## 🔒 安全考虑

### 输入验证

```javascript
// 验证实例名称
function validateInstanceName(name) {
  if (!name || name.trim().length === 0) {
    throw new Error('实例名称不能为空')
  }
  if (name.length > 20) {
    throw new Error('实例名称过长')
  }
  if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(name)) {
    throw new Error('实例名称包含非法字符')
  }
  return true
}
```

### 路径安全

```javascript
// 防止路径遍历攻击
function sanitizePath(path) {
  const normalized = path.replace(/\.\./g, '')
  if (normalized.includes('/')) {
    throw new Error('非法路径')
  }
  return normalized
}
```

### 权限检查

```javascript
// 检查文件权限
async function checkFilePermissions(path) {
  try {
    await access(path, fs.constants.R_OK | fs.constants.W_OK)
    return true
  } catch {
    return false
  }
}
```

## 🧪 测试策略

### 单元测试

```javascript
describe('WeChatMultiInstancePlugin', () => {
  it('should create instance', async () => {
    const plugin = new WeChatMultiInstancePlugin(context)
    const instance = await plugin.createInstance('test')
    expect(instance).toHaveProperty('id')
    expect(instance.name).toBe('test')
  })
})
```

### 集成测试

```javascript
describe('Instance Management', () => {
  it('should start and stop instance', async () => {
    await plugin.startInstance(id)
    let status = await plugin.getInstanceStatus(id)
    expect(status).toBe('running')

    await plugin.stopInstance(id)
    status = await plugin.getInstanceStatus(id)
    expect(status).toBe('stopped')
  })
})
```

### 端到端测试

```javascript
describe('E2E', () => {
  it('should complete full workflow', async () => {
    // 创建
    const instance = await plugin.createInstance('e2e-test')

    // 启动
    await plugin.startInstance(instance.id)
    await waitForRunning(instance.id)

    // 停止
    await plugin.stopInstance(instance.id)
    await waitForStopped(instance.id)

    // 删除
    await plugin.deleteInstance(instance.id)
  })
})
```

## 📚 参考资源

### Apple文档

- [About Code Signing](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/Introduction/Introduction.html)
- [PlistBuddy Usage](https://developer.apple.com/library/archive/documentation/Darwin/Reference/ManPages/man1/PlistBuddy.1.html)
- [codesign Man Page](https://developer.apple.com/library/archive/documentation/Darwin/Reference/ManPages/man1/codesign.1.html)

### Node.js文档

- [child_process](https://nodejs.org/api/child_process.html)
- [fs/promises](https://nodejs.org/api/fs.html#fspromises-api)
- [Path](https://nodejs.org/api/path.html)

### 社区资源

- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [macOS App Structure](https://developer.apple.com/library/archive/documentation/CoreFoundation/Conceptual/CFBundles/)
- [Bundle Programming Guide](https://developer.apple.com/library/archive/documentation/CoreFoundation/Conceptual/CFBundles/)

---

**最后更新**: 2026-01-10
**版本**: 1.0.0
**作者**: Rokun
