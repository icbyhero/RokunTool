# 测试框架建立 - 设计文档

## 概述

本文档描述 RokunTool 项目测试框架的技术设计和实现方案。

## 技术选型

### 单元测试框架: Vitest

**选择理由**:
- 基于 Vite,与现有构建工具完美集成
- 快速的测试执行(使用 Vite 的 HMR 和转换管道)
- 兼容 Jest API,迁移成本低
- 原生支持 TypeScript
- 内置代码覆盖率(使用 c8)
- 优秀的 ESM 支持

**配置要点**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom', // 或 'node'
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'json'],
      exclude: ['node_modules/', 'test/', '*.test.ts']
    }
  }
})
```

### 组件测试: @testing-library/react

**选择理由**:
- React 官方推荐的组件测试方案
- 关注用户行为而非实现细节
- 良好的可访问性测试
- 与 Vitest 兼容

### E2E测试: Playwright

**选择理由**:
- 跨浏览器支持
- 快速可靠的测试执行
- 内置等待和重试机制
- 优秀的调试工具
- 支持 Electron

## 测试分层架构

```
┌─────────────────────────────────────┐
│     E2E Tests (Playwright)          │
│  - 应用启动流程                       │
│  - 插件加载/卸载流程                  │
│  - 权限申请流程                       │
│  - 完整用户场景                       │
└─────────────────────────────────────┘
              ↑
┌─────────────────────────────────────┐
│  Integration Tests (Vitest)          │
│  - 插件加载器集成测试                 │
│  - IPC通信集成测试                    │
│  - 插件方法调用流程                   │
└─────────────────────────────────────┘
              ↑
┌─────────────────────────────────────┐
│    Unit Tests (Vitest)               │
│  - 插件加载器单元测试                 │
│  - 权限系统单元测试                   │
│  - IPC通信单元测试                    │
│  - 服务层单元测试                     │
│  - 工具函数单元测试                   │
└─────────────────────────────────────┘
```

## 测试目录结构

```
rokun-tool/
├── test/
│   ├── setup.ts              # 测试环境设置
│   ├── mocks/               # Mock 数据和工具
│   │   ├── electron.mock.ts
│   │   ├── fs.mock.ts
│   │   └── plugins.mock.ts
│   └── utils/               # 测试工具函数
│       ├── test-helpers.ts
│       └── fixtures.ts
├── src/
│   ├── main/
│   │   ├── plugins/
│   │   │   ├── loader.test.ts
│   │   │   └── registry.test.ts
│   │   ├── permissions/
│   │   │   └── permission-service.test.ts
│   │   ├── ipc/
│   │   │   └── handlers.test.ts
│   │   └── services/
│   │       ├── fs.test.ts
│   │       ├── process.test.ts
│   │       ├── config.test.ts
│   │       └── logger.test.ts
│   └── renderer/
│       └── components/
│           └── *.test.tsx
└── tests/
    └── e2e/
        ├── plugins.spec.ts
        ├── permissions.spec.ts
        └── app.spec.ts
```

## 核心模块测试策略

### 1. 插件加载器测试

**测试范围**:
- 插件目录扫描逻辑
- 插件元数据解析验证
- 插件加载成功场景
- 插件加载失败处理
- 插件依赖解析
- 插件生命周期钩子调用

**Mock 策略**:
```typescript
// Mock 文件系统
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn()
}))

// Mock 插件模块
vi.mock('../plugins/test-plugin/index.js')
```

### 2. 权限系统测试

**测试范围**:
- 权限声明解析
- 权限检查逻辑
- 权限授予流程
- 权限拒绝流程
- 权限持久化(文件读写)
- 权限撤销功能

**测试数据**:
```typescript
const mockPermissions = {
  pluginId: 'test-plugin',
  permissions: ['fs:read', 'process:exec']
}
```

### 3. IPC通信测试

**测试范围**:
- IPC 消息路由
- 消息验证(参数校验)
- 错误处理
- 超时处理
- 消息序列化/反序列化

**Mock 策略**:
```typescript
// Mock Electron IPC
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn()
  }
}))
```

### 4. 服务层测试

**文件系统服务**:
- 文件读取操作
- 文件写入操作
- 目录遍历
- 错误处理

**进程服务**:
- 命令执行
- 权限检查
- 进程管理
- 输出捕获

**配置服务**:
- 配置读取
- 配置写入
- 配置删除
- 默认值处理

### 5. Rime 插件测试

**测试范围**:
- 配方列表获取
- 配方安装(使用 mock)
- 配方更新
- 配方卸载
- Rime 目录检测

**Mock 策略**:
```typescript
// Mock rime-install 命令
vi.mock('../../context', () => ({
  api: {
    process: {
      exec: vi.fn().mockResolvedValue({
        stdout: 'Installation successful',
        stderr: ''
      })
    }
  }
}))
```

## E2E 测试策略

### 测试场景

1. **应用启动流程**
   - 应用成功启动
   - 主窗口显示
   - 插件列表加载
   - 无错误日志

2. **插件加载流程**
   - 扫描插件目录
   - 加载插件元数据
   - 调用 onLoad 钩子
   - 插件状态为 loaded

3. **权限申请流程**
   - 插件声明权限
   - 自动授予权限
   - 权限持久化
   - 后续操作使用权限

4. **插件方法调用流程**
   - 前端调用插件方法
   - IPC 路由到主进程
   - 插件方法执行
   - 结果返回到前端

## 代码覆盖率策略

### 目标覆盖率

- **总体覆盖率**: > 60%
- **核心模块覆盖率**:
  - 插件加载器: > 70%
  - 权限系统: > 80%
  - IPC 通信: > 70%
  - 服务层: > 60%

### 覆盖率配置

```typescript
// vitest.config.ts
coverage: {
  provider: 'c8',
  reporter: ['text', 'html', 'json'],
  exclude: [
    'node_modules/',
    'test/',
    '*.test.ts',
    '*.test.tsx',
    '*.config.ts',
    'dist/',
    'out/'
  ],
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 50,
    statements: 60
  }
}
```

## CI/CD 集成

### 测试脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:all": "pnpm test && pnpm test:e2e"
  }
}
```

### GitHub Actions 配置

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
```

## 测试最佳实践

### 1. 测试命名

```typescript
describe('PluginLoader', () => {
  describe('loadPackage', () => {
    it('should load plugin package.json successfully', async () => {
      // ...
    })

    it('should return null for invalid package.json', async () => {
      // ...
    })
  })
})
```

### 2. AAA 模式

```typescript
it('should grant permissions to plugin', async () => {
  // Arrange - 准备测试数据
  const pluginId = 'test-plugin'
  const permissions = ['fs:read']

  // Act - 执行操作
  await permissionService.grantPermissions(pluginId, permissions)

  // Assert - 验证结果
  expect(permissionService.hasPermission(pluginId, 'fs:read')).toBe(true)
})
```

### 3. Mock 使用原则

- 只 mock 外部依赖(文件系统、进程、网络)
- 不 mock 被测试的模块
- 使用 vi.clearAllMocks() 清理 mock 状态
- 使用 vi.mocked() 获取类型安全的 mock 实例

### 4. 测试隔离

- 每个测试独立运行,不依赖其他测试
- 使用 beforeEach/afterEach 清理状态
- 避免共享状态
- 使用描述性的测试名称

## 测试数据管理

### Fixtures

```typescript
// test/fixtures/plugins.ts
export const mockPluginPackage = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  author: 'Test Author',
  license: 'MIT',
  main: 'index.js',
  permissions: ['fs:read']
}
```

### Test Helpers

```typescript
// test/utils/test-helpers.ts
export function createMockPlugin(id: string, permissions: string[]) {
  return {
    metadata: {
      id,
      name: 'Mock Plugin',
      version: '1.0.0',
      // ...
    },
    path: `/mock/plugins/${id}`,
    load: vi.fn().mockResolvedValue({}),
    enable: vi.fn().mockResolvedValue(undefined),
    disable: vi.fn().mockResolvedValue(undefined)
  }
}
```

## 性能考虑

### 测试并行化

```typescript
// vitest.config.ts
test: {
  pool: 'threads',
  poolOptions: {
    threads: {
      singleThread: false,
      minThreads: 2,
      maxThreads: 4
    }
  }
}
```

### 测试选择性运行

```bash
# 只运行某个文件的测试
pnpm test loader.test.ts

# 只运行匹配名称的测试
pnpm test -t "plugin"

# 只运行修改过的文件
pnpm test --changed
```

## 已知挑战和解决方案

### 1. Electron 环境测试

**挑战**: Electron API 在 Node 环境不可用

**解决方案**:
- 使用 `happy-dom` 模拟浏览器环境
- Mock Electron API (`electron-mock`)
- 主进程测试使用 `node` 环境

### 2. 异步测试

**挑战**: 异步操作的正确测试

**解决方案**:
```typescript
it('should load plugin asynchronously', async () => {
  const plugin = await loader.loadPackage(pluginPath)
  expect(plugin).toBeDefined()
})
```

### 3. 文件系统隔离

**挑战**: 测试不应该影响实际文件系统

**解决方案**:
- 使用 Memfs 或 mock `fs/promises`
- 在临时目录进行文件操作测试
- 测试后清理临时文件

## 总结

本测试框架设计遵循以下原则:

1. **分层测试**: 单元测试 → 集成测试 → E2E 测试
2. **快速反馈**: 单元测试 < 10秒,全部测试 < 30秒
3. **高覆盖率**: 核心模块覆盖率 > 60%
4. **可维护性**: 清晰的测试结构,良好的 mock 策略
5. **CI/CD 就绪**: 测试可以自动化运行

通过建立完善的测试体系,可以:
- 提高代码质量和可靠性
- 加速开发迭代
- 支持重构和优化
- 防止回归问题
