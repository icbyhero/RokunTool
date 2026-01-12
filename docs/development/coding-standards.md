# 编码规范

本文档定义 RokunTool 项目的编码规范和最佳实践。

## 目录

- [通用规范](#通用规范)
- [TypeScript 规范](#typescript-规范)
- [React 规范](#react-规范)
- [代码风格](#代码风格)
- [命名规范](#命名规范)
- [文件组织](#文件组织)
- [注释规范](#注释规范)
- [测试规范](#测试规范)

## 通用规范

### 1. 代码原则

- **KISS**: 保持简单直接
- **DRY**: 不要重复自己
- **YAGNI**: 你不会需要它(避免过度设计)
- **SOLID**: 遵循 SOLID 原则

### 2. 错误处理

**始终处理异步错误**:

```typescript
// ✅ 好的做法
async function readFile() {
  try {
    const content = await fs.readFile('file.txt', 'utf-8')
    return content
  } catch (error) {
    logger.error('读取文件失败:', error)
    throw error
  }
}

// ❌ 坏的做法
async function readFile() {
  return await fs.readFile('file.txt', 'utf-8')
}
```

**提供有意义的错误信息**:

```typescript
// ✅ 好的做法
throw new Error(`插件 ${pluginId} 激活失败: ${error.message}`)

// ❌ 坏的做法
throw new Error('错误')
```

### 3. 类型安全

**避免 any 类型**:

```typescript
// ✅ 好的做法
function processUser(user: User) {
  console.log(user.name)
}

// ❌ 坏的做法
function processUser(user: any) {
  console.log(user.name)
}
```

**使用类型断言谨慎**:

```typescript
// ✅ 好的做法
const value = data as string

// ❌ 坏的做法
const value: any = data
```

### 4. 异步编程

**使用 async/await 而不是回调**:

```typescript
// ✅ 好的做法
async function loadPlugin() {
  const plugin = await fs.readFile('plugin.js')
  return plugin
}

// ❌ 坏的做法
function loadPlugin(callback) {
  fs.readFile('plugin.js', (err, data) => {
    callback(err, data)
  })
}
```

**并行处理独立操作**:

```typescript
// ✅ 好的做法
await Promise.all([
  loadConfig(),
  loadDatabase(),
  loadPlugins()
])

// ❌ 坏的做法
await loadConfig()
await loadDatabase()
await loadPlugins()
```

## TypeScript 规范

### 1. 类型定义

**使用 interface 定义对象形状**:

```typescript
// ✅ 好的做法
interface User {
  id: string
  name: string
  email: string
}

// ❌ 坏的做法
type User = {
  id: string
  name: string
  email: string
}
```

**使用 type 定义联合类型**:

```typescript
// ✅ 好的做法
type Permission = 'granted' | 'denied' | 'pending'

// ❌ 坏的做法
interface Permission {
  value: 'granted' | 'denied' | 'pending'
}
```

### 2. 函数签名

**明确参数和返回类型**:

```typescript
// ✅ 好的做法
function add(a: number, b: number): number {
  return a + b
}

// ❌ 坏的做法
function add(a, b) {
  return a + b
}
```

### 3. 泛型

**使用有意义的泛型名称**:

```typescript
// ✅ 好的做法
function first<T>(items: T[]): T | undefined {
  return items[0]
}

// ❌ 坏的做法
function first<T>(items: T[]): T | undefined {
  return items[0]
}
```

### 4. 枚举

**使用枚举代替魔法字符串**:

```typescript
// ✅ 好的做法
enum Permission {
  Granted = 'granted',
  Denied = 'denied',
  Pending = 'pending'
}

// ❌ 坏的做法
const PERMISSION_GRANTED = 'granted'
const PERMISSION_DENIED = 'denied'
```

### 5. 严格模式

**启用 TypeScript 严格模式**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## React 规范

### 1. 组件定义

**使用函数组件和 Hooks**:

```typescript
// ✅ 好的做法
function MyComponent({ name }: { name: string }) {
  const [count, setCount] = useState(0)

  return <div>{name}: {count}</div>
}

// ❌ 坏的做法
class MyComponent extends Component {
  render() {
    return <div>{this.props.name}</div>
  }
}
```

### 2. Props 类型

**使用 interface 定义 Props**:

```typescript
// ✅ 好的做法
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

function Button({ label, onClick, disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>
}

// ❌ 坏的做法
function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

### 3. Hooks 规则

**遵循 Hooks 规则**:

```typescript
// ✅ 好的做法
function MyComponent() {
  const [state, setState] = useState(0)  // 顶层调用

  useEffect(() => {
    // effect 逻辑
  }, [])  // 顶层调用

  return <div>{state}</div>
}

// ❌ 坏的做法
function MyComponent() {
  if (condition) {
    const [state, setState] = useState(0)  // 条件中调用
  }
  return <div></div>
}
```

### 4. 依赖数组

**正确使用依赖数组**:

```typescript
// ✅ 好的做法
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.unsubscribe()
}, [userId])  // 明确依赖

// ❌ 坏的做法
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.unsubscribe()
}, [])  // 缺少依赖
```

### 5. 组件拆分

**保持组件小而专注**:

```typescript
// ✅ 好的做法
function UserList() {
  return (
    <div>
      <UserHeader />
      <UserFilter />
      <UserTable />
      <UserPagination />
    </div>
  )
}

// ❌ 坏的做法
function UserList() {
  return (
    <div>
      {/* 200 行 JSX */}
    </div>
  )
}
```

## 代码风格

### 1. 缩进和格式

**使用 2 空格缩进**:

```typescript
// ✅ 好的做法
function example() {
  if (condition) {
    doSomething()
  }
}

// ❌ 坏的做法
function example() {
    if (condition) {
        doSomething()
    }
}
```

### 2. 分号

**始终使用分号**:

```typescript
// ✅ 好的做法
const x = 1
const y = 2

// ❌ 坏的做法
const x = 1
const y = 2
```

### 3. 引号

**TypeScript/JavaScript 使用单引号**:

```typescript
// ✅ 好的做法
const name = 'John'

// ❌ 坏的做法
const name = "John"
```

**JSX 属性使用双引号**:

```typescript
// ✅ 好的做法
<button onClick={handler} disabled={false}>Click</button>

// ❌ 坏的做法
<button onClick={handler} disabled='false'>Click</button>
```

### 4. 行宽

**限制行宽为 100 字符**:

```typescript
// ✅ 好的做法
const result = await someVeryLongFunctionName(
  argument1,
  argument2,
  argument3
)

// ❌ 坏的做法
const result = await someVeryLongFunctionName(argument1, argument2, argument3, argument4, argument5)
```

## 命名规范

### 1. 文件命名

- **TypeScript/JavaScript**: kebab-case
- **React 组件**: PascalCase
- **测试文件**: *.test.ts

```
src/
├── components/
│   ├── user-list.tsx        # 组件
│   ├── user-list.test.tsx   # 测试
│   └── user-types.ts        # 类型
├── utils/
│   └── date-helper.ts       # 工具函数
└── hooks/
    └── use-user-data.ts     # Hook
```

### 2. 变量命名

**使用 camelCase**:

```typescript
// ✅ 好的做法
const userName = 'John'
const isActive = true

// ❌ 坏的做法
const user_name = 'John'
const active = true
```

### 3. 常量命名

**使用 UPPER_SNAKE_CASE**:

```typescript
// ✅ 好的做法
const MAX_RETRY_COUNT = 3
const DEFAULT_TIMEOUT = 5000

// ❌ 坏的做法
const maxRetryCount = 3
const defaultTimeout = 5000
```

### 4. 类和接口命名

**使用 PascalCase**:

```typescript
// ✅ 好的做法
class UserService {}
interface UserRepository {}
type PermissionStatus = 'granted' | 'denied'

// ❌ 坏的做法
class userService {}
interface user_repository {}
```

### 5. 私有成员

**使用下划线前缀**:

```typescript
// ✅ 好的做法
class MyClass {
  private _privateField: string
  private _privateMethod(): void {}

  public publicField: string
  public publicMethod(): void {}
}

// ❌ 坏的做法
class MyClass {
  private privateField: string
  privateField: string
}
```

### 6. 布尔值

**使用 is/has/should 前缀**:

```typescript
// ✅ 好的做法
const isActive = true
const hasPermission = false
const shouldUpdate = true

// ❌ 坏的做法
const active = true
const permission = false
const update = true
```

## 文件组织

### 1. 目录结构

**按功能组织**:

```
src/
├── main/              # 主进程
│   ├── plugins/      # 插件系统
│   ├── ipc/          # IPC 处理
│   └── services/     # 服务
├── renderer/         # 渲染进程
│   └── src/
│       ├── components/
│       │   ├── layout/
│       │   ├── pages/
│       │   └── ui/
│       └── store/
└── shared/           # 共享代码
    └── types/
```

### 2. 导入顺序

**按类型分组导入**:

```typescript
// 1. Node.js 内置模块
import { promises as fs } from 'fs'
import path from 'path'

// 2. 第三方模块
import React from 'react'
import { create } from 'zustand'

// 3. 项目内部模块
import { Button } from '@/components/ui/button'
import { usePluginStore } from '@/store/pluginStore'

// 4. 类型导入
import type { Plugin } from '@/types/plugin'
```

### 3. 导出方式

**优先使用命名导出**:

```typescript
// ✅ 好的做法
export function helperFunction() {}
export const CONSTANT_VALUE = 123

// ❌ 坏的做法
export default function helperFunction() {}
```

**仅在组件和配置使用默认导出**:

```typescript
// ✅ 可接受
export default function MyComponent() {}

// ✅ 可接受
export default {
  apiKey: process.env.API_KEY
}
```

## 注释规范

### 1. JSDoc

**为公共 API 添加 JSDoc**:

```typescript
/**
 * 加载插件
 * @param pluginId - 插件 ID
 * @param options - 加载选项
 * @returns 加载的插件实例
 * @throws {PluginError} 如果插件不存在或加载失败
 */
async function loadPlugin(
  pluginId: string,
  options?: LoadOptions
): Promise<Plugin> {
  // 实现
}
```

### 2. 行内注释

**解释"为什么"而不是"是什么"**:

```typescript
// ✅ 好的做法
// 使用 setTimeout 避免 Promise 微任务阻塞
setTimeout(() => callback(), 0)

// ❌ 坏的做法
// 设置超时
setTimeout(() => callback(), 0)
```

### 3. TODO 注释

**使用标准 TODO 格式**:

```typescript
// TODO: 添加插件版本检查
// FIXME: 修复内存泄漏
// HACK: 临时解决方案,待重构
// NOTE: 这是已知限制
```

### 4. 注释块

**使用注释块分隔逻辑**:

```typescript
function processPlugin(plugin: Plugin) {
  // ===== 验证插件 =====
  if (!plugin.id) {
    throw new Error('插件缺少 ID')
  }

  // ===== 加载插件 =====
  const instance = await loadPlugin(plugin.path)

  // ===== 激活插件 =====
  await instance.activate()

  return instance
}
```

## 测试规范

### 1. 测试结构

**使用 AAA 模式(Arrange-Act-Assert)**:

```typescript
describe('UserService', () => {
  it('should create user with valid data', async () => {
    // Arrange - 准备测试数据
    const userData = {
      name: 'John',
      email: 'john@example.com'
    }

    // Act - 执行操作
    const user = await userService.create(userData)

    // Assert - 验证结果
    expect(user.id).toBeDefined()
    expect(user.name).toBe(userData.name)
  })
})
```

### 2. 测试命名

**描述应该清晰且具有可读性**:

```typescript
// ✅ 好的做法
it('should return empty array when no plugins exist')
it('should throw error when plugin file is missing')

// ❌ 坏的做法
it('test 1')
it('works')
```

### 3. 测试覆盖

**核心功能必须有测试**:

- 公共 API
- 复杂逻辑
- 错误处理
- 边界情况

### 4. Mock 和 Spy

**谨慎使用 mock**:

```typescript
// ✅ 好的做法 - 只 mock 外部依赖
jest.mock('electron', () => ({
  ipcMain: {
    on: jest.fn()
  }
}))

// ❌ 坏的做法 - mock 被测试的代码
jest.mock('./userService')
```

## ESLint 和 Prettier

项目配置了 ESLint 和 Prettier,确保:

1. **提交前自动格式化**: 使用 `lint-staged` 和 `husky`
2. **CI 检查**: 所有 PR 必须通过 ESLint 检查
3. **编辑器集成**: 安装 ESLint 和 Prettier 插件

### 运行检查

```bash
# ESLint 检查
pnpm lint

# 自动修复
pnpm lint:fix

# Prettier 格式化
pnpm format
```

## 最佳实践总结

### ✅ DO

- 使用 TypeScript 严格模式
- 编写有意义的注释
- 保持函数短小专注
- 错误处理要完善
- 编写单元测试
- 遵循单一职责原则
- 使用语义化命名

### ❌ DON'T

- 不要使用 `any` 类型
- 不要忽略错误
- 不要写重复代码
- 不要过度优化
- 不要硬编码配置
- 不要忽略类型检查错误
- 不要写太长的函数

---

**相关文档**:
- [系统架构](architecture.md)
- [插件系统](plugin-system.md)
