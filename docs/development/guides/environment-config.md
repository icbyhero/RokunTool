# 环境配置说明

## 概述

RokunTool 使用统一的环境配置系统来管理开发和生产环境的不同设置。

## 配置文件

### `.env.example`

环境配置示例文件,包含所有可用的配置选项和说明。

### `.env.development`

开发环境配置文件(默认使用)。

**特点**:
- 沙箱禁用,便于调试
- 开发者工具自动打开
- 详细日志输出
- 插件热重载启用

### `.env.production`

生产环境配置文件。

**特点**:
- 沙箱启用,确保安全
- 开发者工具不自动打开
- 日志级别 info
- 插件热重载禁用

## 使用方法

### 1. 开发模式(默认)

```bash
# 方式1: 使用 npm script (推荐)
npm run dev

# 方式2: 手动设置环境变量
NODE_ENV=development npm run dev

# 方式3: 使用旧的环境变量(仍然支持)
DISABLE_SANDBOX=1 npm run dev
```

**效果**:
- 🔓 沙箱禁用
- 🔍 开发者工具自动打开
- 📝 详细日志
- 🔄 插件热重载

### 2. 生产模式(测试生产构建)

```bash
# 方式1: 使用 npm script (推荐)
npm run dev:prod

# 方式2: 手动设置环境变量
NODE_ENV=production npm run dev
```

**效果**:
- 🛡️ 沙箱启用
- 🔒 开发者工具不自动打开
- 📊 正常日志级别
- ⚡ 性能优化

### 3. 构建生产版本

```bash
npm run build
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

构建时会自动使用 `.env.production` 配置。

## 配置选项详解

### 沙箱配置

| 配置项 | 开发环境 | 生产环境 | 说明 |
|--------|---------|---------|------|
| `SANDBOX_ENABLED` | false | true | 是否启用插件沙箱隔离 |
| `SANDBOX_TIMEOUT` | Infinity | 30000 | 沙箱超时时间(毫秒) |
| `SANDBOX_STRICT` | false | true | 是否启用严格模式 |

### 插件配置

| 配置项 | 开发环境 | 生产环境 | 说明 |
|--------|---------|---------|------|
| `PLUGIN_HOT_RELOAD` | true | false | 插件热重载 |
| `PLUGIN_LOG_LEVEL` | debug | info | 日志级别 |

### 权限配置

| 配置项 | 开发环境 | 生产环境 | 说明 |
|--------|---------|---------|------|
| `PERMISSION_ENABLED` | true | true | 是否启用权限系统 |
| `PERMISSION_AUTO_GRANT` | true | false | 自动授予权限(仅开发) |

### UI 配置

| 配置项 | 开发环境 | 生产环境 | 说明 |
|--------|---------|---------|------|
| `DEVTOOLS_AUTO_OPEN` | true | false | 自动打开开发者工具 |
| `SHOW_DEBUG_INFO` | true | false | 显示调试信息 |

## 兼容性

### 旧环境变量支持

为了向后兼容,以下旧的环境变量仍然有效:

```bash
# 旧方式(仍然支持)
DISABLE_SANDBOX=1 npm run dev

# 新方式(推荐)
# 直接使用 npm run dev,会自动读取 .env.development
```

### 迁移建议

如果您之前使用 `DISABLE_SANDBOX=1`:

**Before**:
```bash
DISABLE_SANDBOX=1 npm run dev
```

**After**:
```bash
# 方式1: 使用默认开发配置(推荐)
npm run dev

# 方式2: 明确指定环境
NODE_ENV=development npm run dev
```

## 自定义配置

如果您想自定义配置,可以:

1. 复制 `.env.example` 为 `.env.development`
2. 修改需要的配置项
3. 运行 `npm run dev`

## 常见问题

### Q: 如何在生产环境测试沙箱?

```bash
npm run dev:prod
```

### Q: 如何禁用开发者工具?

在 `.env.development` 中设置:
```
DEVTOOLS_AUTO_OPEN=false
```

### Q: 如何调整沙箱超时时间?

在 `.env.development` 中设置:
```
SANDBOX_TIMEOUT=60000  # 60秒
```

### Q: 开发模式和生产模式有什么区别?

主要区别:
- **开发模式**: 沙箱禁用,便于调试和快速开发
- **生产模式**: 沙箱启用,确保安全性和性能

## 故障排查

### 配置未生效?

1. 确认环境变量文件存在:
   ```bash
   ls -la .env.development
   ```

2. 确认环境变量正确设置:
   ```bash
   NODE_ENV=development npm run dev
   ```

3. 查看启动日志:
   ```
   🔧 当前环境: development
   🛡️  沙箱配置: ❌ 禁用 (超时: 无限制, 严格: false)
   ```

### 沙箱仍然启用?

检查 `NODE_ENV` 是否正确设置:
```bash
echo $NODE_ENV  # 应该是 development
```

## 相关文档

- [插件沙箱安全归档](../../openspec/changes/archive/2026-01-15-plugin-sandbox-security/)
- [开发指南](../docs/development/README.md)

---

**最后更新**: 2026-01-15
