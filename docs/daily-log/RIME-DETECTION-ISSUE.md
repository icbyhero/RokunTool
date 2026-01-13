# Rime 检测问题排查指南

## 问题描述

Rime 配置插件无法正确检测到系统已安装的 Rime 输入法。

## 可能的原因

1. **Rime 安装路径不在默认路径列表中**
   - 当前检测的默认路径:
     - `~/Library/Rime` (macOS 鼠须管)
     - `~/.local/share/fcitx5/rime` (Linux fcitx5)
     - `~/.config/ibus/rime` (Linux ibus)

2. **目录权限问题**
   - 插件进程可能没有权限访问 Rime 配置目录

3. **Rime 未正确安装**
   - Rime 输入法程序可能已安装,但用户配置目录未创建

## 诊断方法

### 方法1: 使用内置诊断功能

1. 打开 RokunTool 应用
2. 进入"Rime 配置管理"页面
3. 如果显示"Rime 未安装",点击"诊断"按钮
4. 查看弹出的诊断信息,包括:
   - HOME 目录路径
   - 已检查的目录列表
   - 找到的目录列表
   - 错误信息

### 方法2: 手动检查 Rime 安装

在终端中运行以下命令:

```bash
# 检查默认 Rime 目录是否存在
ls -la ~/Library/Rime

# 如果不存在,检查其他可能的路径
find ~ -name "*.schema.yaml" -type f 2>/dev/null | head -5
```

### 方法3: 查看插件日志

运行应用后,在控制台中查看插件日志:

```
[Rime Config Plugin] 开始检测 Rime 安装...
[Rime Config Plugin] 检查目录: /Users/xxx/Library/Rime
[Rime Config Plugin] ❌ 未检测到 Rime 安装，已检查以下目录:
```

## 解决方案

### 方案1: 手动创建 Rime 配置目录

如果 Rime 输入法已安装但配置目录不存在,手动创建:

```bash
mkdir -p ~/Library/Rime
```

### 方案2: 添加自定义路径(需要修改插件)

编辑 `plugins/rime-config/index.js`,在 `RIME_DIRS` 数组中添加您的 Rime 路径:

```javascript
const RIME_DIRS = [
  join(process.env.HOME, 'Library', 'Rime'),
  join(process.env.HOME, '.local', 'share', 'fcitx5', 'rime'),
  join(process.env.HOME, '.config', 'ibus', 'rime'),
  // 添加自定义路径
  '/path/to/your/rime/directory'
]
```

### 方案3: 检查文件权限

确保插件进程有权限访问 Rime 目录:

```bash
chmod -R 755 ~/Library/Rime
```

## 常见问题

### Q1: 我安装了鼠须管,为什么检测不到?

**A:** 鼠须管的用户配置目录应该在 `~/Library/Rime`,如果不存在:
1. 打开鼠须管应用
2. 点击菜单栏的鼠须管图标
3. 选择"用户设定"→"打开用户目录"
4. 这会自动创建 `~/Library/Rime` 目录

### Q2: 我使用的是 Linux 上的 fcitx5-rime,路径在哪里?

**A:** fcitx5-rime 的配置目录应该在 `~/.local/share/fcitx5/rime`,如果不存在,手动创建:

```bash
mkdir -p ~/.local/share/fcitx5/rime
```

### Q3: 诊断功能显示找到了目录,但应用还是说未安装?

**A:** 这可能是检测逻辑的问题,请查看控制台日志,并提交 issue 包含:
1. 诊断信息的完整输出
2. 控制台日志
3. 操作系统版本
4. Rime 输入法版本

## 相关文件

- 插件代码: `plugins/rime-config/index.js`
- 前端页面: `rokun-tool/src/renderer/src/components/pages/RimeConfig.tsx`
- 检测逻辑: `detectRimeInstallation()` 方法
- 诊断方法: `diagnoseRimeInstallation()` 方法

## 更新日志

- 2026-01-13: 添加诊断功能和详细日志
- 2026-01-13: 改进错误提示,显示检查的目录列表
