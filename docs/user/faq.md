# 常见问题 (FAQ)

这里收集了 RokunTool 使用过程中的常见问题和解决方案。

## 目录

- [安装问题](#安装问题)
- [使用问题](#使用问题)
- [插件问题](#插件问题)
- [权限问题](#权限问题)
- [性能问题](#性能问题)
- [其他问题](#其他问题)

## 安装问题

### Q: pnpm install 报错 "ENOENT: no such file or directory"

**A**: 这通常是网络问题或 pnpm 缓存损坏。尝试:

```bash
# 清除 pnpm 缓存
pnpm store prune

# 删除 node_modules
rm -rf node_modules

# 重新安装
pnpm install
```

如果仍然失败,尝试使用 npm:

```bash
npm install
```

### Q: Electron 下载失败

**A**: Electron 需要从 GitHub 下载二进制文件。如果下载失败:

1. **使用镜像** (推荐):

```bash
# 设置 Electron 镜像
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

# 然后安装
pnpm install
```

2. **手动下载**:

从 [Electron Releases](https://github.com/electron/electron/releases) 下载对应版本,放到缓存目录。

### Q: TypeScript 编译错误

**A**: 确保安装了所有依赖:

```bash
pnpm install

# 清理 TypeScript 缓存
rm -rf tsconfig.tsbuildinfo

# 重新编译
pnpm typecheck
```

## 使用问题

### Q: 应用启动后白屏

**A**: 这是渲染进程加载失败。检查:

1. **查看控制台错误** (按 `Cmd+Option+I`)
2. **检查开发服务器**:

```bash
# 确保开发服务器正在运行
pnpm dev
```

3. **检查端口占用**:

```bash
# 查看端口 5173 是否被占用
lsof -i :5173
```

### Q: 插件列表为空

**A**: 插件未加载。检查:

1. **插件目录存在**:

```bash
ls -la plugins/
```

2. **插件有 index.js**:

```bash
ls -la plugins/wechat-multi-instance/
```

3. **检查插件元数据**:

每个插件应该有 `package.json` 或 `plugin.yml` 文件。

### Q: 如何切换插件?

**A**: 点击插件卡片上的开关可以启用或禁用插件。禁用的插件不会加载。

## 插件问题

### Q: 微信分身创建失败

**可能原因**:

1. **微信未安装**
   - 确保已从 Mac App Store 或微信官网安装微信

2. **权限不足**
   - 确保授予了 `fs:write` 和 `process:exec` 权限

3. **磁盘空间不足**
   - 检查 `~/Applications` 目录是否有足够空间

4. **代码签名失败**
   - 查看控制台日志获取详细错误信息
   - 确保系统允许运行未签名的应用

**解决方案**:

```bash
# 检查微信安装
ls -la /Applications/WeChat.app

# 检查磁盘空间
df -h ~/Applications

# 手动测试签名
codesign --force --deep --sign - /Applications/WeChat.app
```

### Q: 微信分身无法启动

**A**: 可能是签名问题。尝试:

```bash
# 重新签名 (使用插件重建功能)
# 或手动:
codesign --force --deep --sign - ~/Applications/WeChat3.app
```

如果仍然失败,在系统设置中允许运行未签名的应用:

**系统偏好设置 > 安全性与隐私 > 通用 > 允许从以下位置下载的 App**

### Q: Rime 配置插件不工作

**A**: 确保:

1. Rime 已安装 (推荐 [鼠鬚管](https://rime.im/))
2. Rime 配置目录存在: `~/Library/Rime/`
3. 授予了 `fs:write` 权限

### Q: 插件更新后如何重置?

**A**: 删除插件配置:

```bash
# 微信分身插件
rm ~/.rokun-tool/plugins/wechat-multi-instance/instances.json

# Rime 配置插件
rm ~/.rokun-tool/plugins/rime-config/config.json

# 然后重启应用
pnpm dev
```

## 权限问题

### Q: 权限对话框不弹出

**A**: 检查:

1. **是否已授予权限**:

```bash
cat ~/.rokun-tool/permissions/state.json
```

2. **重启应用**:

权限状态缓存在内存中,重启后生效。

### Q: 如何撤销已授予的权限?

**A**: 编辑权限文件:

```bash
# 编辑权限状态
vi ~/.rokun-tool/permissions/state.json

# 将不需要的权限改为 "denied"
```

或删除权限文件完全重置:

```bash
rm ~/.rokun-tool/permissions/state.json
```

### Q: 为什么每次都需要请求权限?

**A**: 这是设计特性,确保:
- 用户清楚知道插件在做什么
- 恶意插件无法偷偷操作

如果您信任某个插件,可以预授权:

编辑 `~/.rokun-tool/permissions/state.json`:

```json
{
  "plugins": {
    "wechat-multi-instance": {
      "permissions": {
        "fs:write": "granted",
        "process:exec": "granted"
      }
    }
  }
}
```

## 性能问题

### Q: 应用占用内存过多

**A**: 正常情况。Electron 应用通常占用 100-200MB 内存。

如果占用过高 (>500MB):

1. **重启应用**
2. **检查插件数量** - 禁用不需要的插件
3. **检查内存泄漏** - 使用 Chrome DevTools 分析

### Q: 应用启动慢

**A**: 可能原因:

1. **插件数量多** - 禁用不需要的插件
2. **磁盘 I/O 慢** - 检查磁盘健康
3. **首次启动** - 首次启动需要初始化,后续会快

优化启动速度:

```bash
# 清理缓存
rm -rf ~/.rokun-tool/cache

# 减少插件数量
```

### Q: CPU 占用高

**A**: 检查:

1. **是否有插件频繁轮询** - 检查插件日志
2. **开发模式** - 开发模式会监听文件变化,占用更高 CPU

生产构建会更快:

```bash
pnpm build
pnpm run start
```

## 其他问题

### Q: 如何查看日志?

**A**: 开发模式下:

1. **主进程日志**: 终端输出
2. **渲染进程日志**: DevTools Console (`Cmd+Option+I`)

生产模式下:

```bash
# macOS 日志
log stream --predicate 'process == "RokunTool"'

# 或查看日志文件
cat ~/Library/Logs/RokunTool/main.log
```

### Q: 如何备份配置?

**A**: 备份整个配置目录:

```bash
# 创建备份
cp -r ~/.rokun-tool ~/.rokun-tool.backup.$(date +%Y%m%d)

# 或使用 tar 压缩
tar -czf rokun-tool-backup-$(date +%Y%m%d).tar.gz ~/.rokun-tool
```

### Q: 如何迁移到新电脑?

**A**:

1. **在新电脑安装 RokunTool** (参考 [安装指南](installation.md))
2. **复制配置文件**:

```bash
# 在旧电脑上打包
tar -czf rokun-tool-config.tar.gz ~/.rokun-tool

# 传输到新电脑 (使用 U 盘、AirDrop 等)

# 在新电脑上解压
tar -xzf rokun-tool-config.tar.gz -C ~/
```

### Q: 可以同时运行多个实例吗?

**A**: 不推荐。RokunTool 使用单实例模式。

如果需要强行启动多个:

```bash
# 设置不同的用户数据目录
RokunTool --user-data-dir=/tmp/rokun-tool-2
```

### Q: 如何贡献插件?

**A**:

1. 查看 [插件开发指南](../development/plugin-development.md)
2. 使用插件模板: `plugins/plugin-template/`
3. 提交 PR 到项目仓库

### Q: 报告 Bug

**A**: 提交 Issue 时请包含:

1. **系统信息**:
   ```bash
   ./scripts/check-env.sh > system-info.txt
   ```

2. **复现步骤**: 详细的操作步骤

3. **预期行为**: 期望发生什么

4. **实际行为**: 实际发生了什么

5. **日志**: 相关的控制台输出

## 获取更多帮助

- **文档**: [项目文档](../)
- **Issues**: [GitHub Issues](../../issues)
- **讨论**: [GitHub Discussions](../../discussions)

---

**问题未解决?** 请查看 [开发文档](../development/) 或提交 Issue。
