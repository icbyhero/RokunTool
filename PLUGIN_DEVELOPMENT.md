# Rokun Tool 插件开发指南

## 快速开始

### 1. 创建插件目录

```bash
mkdir ~/.rokun-tool/plugins/my-plugin
cd ~/.rokun-tool/plugins/my-plugin
```

### 2. 创建 manifest.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "displayName": "我的插件",
  "description": "插件功能描述",
  "author": "你的名字",
  "permissions": [],
  "entry": "index.html",
  "minAppVersion": "0.1.0"
}
```

### 3. 创建插件界面

创建 `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>我的插件</title>
  <style>
    body {
      background: #2d2d2d;
      color: #ffffff;
      padding: 20px;
    }
  </style>
</head>
<body>
  <h1>我的插件</h1>
  <p>插件内容...</p>
</body>
</html>
```

### 4. 安装插件

将插件目录复制到 `~/.rokun-tool/plugins/`,然后在 Rokun Tool 中启用。

## API 参考

### window.electronAPI

插件可以通过 `window.electronAPI` 访问应用API:

```javascript
// 获取应用版本
const version = await window.electronAPI.getAppVersion();

// 插件管理
const plugins = await window.electronAPI.plugins.list();

// 权限检查
const hasPermission = await window.electronAPI.permissions.check(
  'my-plugin',
  'fs:read'
);

// 配置读写
const config = await window.electronAPI.config.get();
await window.electronAPI.config.set('theme', 'dark');
```

## 权限系统

### 可用权限

| 权限 | 说明 | 使用场景 |
|------|------|---------|
| `fs:read` | 读取文件 | 读取配置文件、数据文件 |
| `fs:write` | 写入文件 | 保存配置、写入日志 |
| `process:spawn` | 启动进程 | 启动外部程序 |
| `network:request` | 网络请求 | API调用、下载文件 |
| `clipboard:read` | 读取剪贴板 | 获取剪贴板内容 |
| `clipboard:write` | 写入剪贴板 | 复制内容到剪贴板 |
| `notification:show` | 显示通知 | 系统通知 |
| `config:read` | 读取配置 | 读取应用配置 |
| `config:write` | 写入配置 | 修改应用配置 |

### 申请权限

在 `manifest.json` 中声明所需权限:

```json
{
  "permissions": ["fs:read", "fs:write"]
}
```

## 最佳实践

### 1. UI 设计

- 使用暗色主题配色
- 遵循应用的设计语言
- 响应式布局

### 2. 权限管理

- 最小权限原则
- 明确说明权限用途
- 妥善处理权限拒绝

### 3. 错误处理

- 提供友好的错误提示
- 记录详细的错误日志
- 优雅降级

### 4. 性能优化

- 避免阻塞主线程
- 合理使用异步操作
- 资源及时释放

## 示例插件

查看 `packages/plugins/hello-world/` 了解完整示例。

## 故障排查

### 插件无法加载

1. 检查 `manifest.json` 格式是否正确
2. 验证所有必填字段是否完整
3. 查看控制台错误日志

### 权限错误

1. 确认在manifest中声明了权限
2. 检查用户是否已授予权限
3. 验证权限名称拼写正确

### 样式问题

1. 使用内联样式或`<style>`标签
2. 避免依赖外部CSS框架
3. 测试不同窗口尺寸

## 进阶主题

### TypeScript 支持

插件可以使用TypeScript开发:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "ES2020"]
  }
}
```

### 构建工具

可以使用Vite、Webpack等工具构建插件:

```bash
npm create vite@latest my-plugin -- --template react
```

### 调试

1. 打开开发者工具
2. 查看Console日志
3. 使用debugger断点

## 更多资源

- [OpenSpec规格说明](../openspec/changes/add-plugin-platform/)
- [示例插件](../packages/plugins/hello-world/)
- [GitHub仓库](https://github.com/icbyhero/Rokun-Tool)
