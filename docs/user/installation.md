# 安装指南

本指南提供 RokunTool 的详细安装说明。

## 目录

- [系统要求](#系统要求)
- [安装方法](#安装方法)
- [依赖安装](#依赖安装)
- [配置](#配置)
- [验证安装](#验证安装)
- [卸载](#卸载)

## 系统要求

### 操作系统

**支持的平台**:
- macOS 12.0 (Monterey) 或更高版本

**架构**:
- Apple Silicon (M1/M2/M3)
- Intel x86_64

### 运行时环境

**必需**:
- **Node.js**: 18.0.0 或更高版本
- **pnpm**: 8.0.0 或更高版本 (推荐)

**可选**:
- **Git**: 用于版本控制

### 硬件要求

- **内存**: 至少 4GB RAM (推荐 8GB)
- **磁盘空间**: 至少 500MB 可用空间
- **网络**: 某些插件需要网络连接

## 安装方法

### 方法 1: 从源码安装 (推荐)

这是推荐的安装方式,适合开发者和想要最新功能的用户。

#### 步骤 1: 安装 Homebrew (如果未安装)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 步骤 2: 安装 Node.js 和 pnpm

```bash
# 安装 Node.js
brew install node

# 验证 Node.js 版本
node --version  # 应该 >= 18.0.0

# 安装 pnpm
npm install -g pnpm

# 验证 pnpm 版本
pnpm --version
```

#### 步骤 3: 克隆项目

```bash
# 使用 HTTPS
git clone https://github.com/your-username/RokunTool.git
cd RokunTool

# 或使用 SSH
git clone git@github.com:your-username/RokunTool.git
cd RokunTool
```

#### 步骤 4: 安装项目依赖

```bash
pnpm install
```

这将安装所有必需的依赖,包括:
- Electron
- React
- TypeScript
- 其他开发和运行时依赖

#### 步骤 5: 启动应用

```bash
# 开发模式
pnpm dev

# 或者构建后运行
pnpm build
pnpm run start
```

### 方法 2: 下载发布包

如果您不想从源码构建,可以下载预编译的版本。

#### 步骤 1: 下载发布包

从 [Releases 页面](../../releases) 下载适合您系统的 `.dmg` 文件。

#### 步骤 2: 安装应用

1. 双击下载的 `.dmg` 文件
2. 将 RokunTool 拖到 Applications 文件夹
3. 从启动台启动 RokunTool

## 依赖安装

### Electron

Electron 会通过 pnpm 自动安装。无需手动安装。

### Git (可选)

如果需要使用 Git 功能:

```bash
brew install git
```

验证安装:

```bash
git --version
```

## 配置

### 环境变量

创建 `.env` 文件配置环境变量 (参考 `config/env.example`):

```bash
cp config/env.example .env
```

编辑 `.env` 文件设置您的选项。

### 插件配置

插件配置文件位于:

```
~/.rokun-tool/
├── plugins/
│   ├── permissions/
│   │   └── state.json           # 权限状态
│   ├── wechat-multi-instance/
│   │   └── instances.json       # 微信分身配置
│   └── rime-config/
│       └── config.json          # Rime 配置
```

### VSCode 配置 (可选)

如果使用 VSCode 开发:

```bash
# 安装推荐的扩展
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

## 验证安装

### 运行环境检查

```bash
./scripts/check-env.sh
```

预期输出:

```
✅ Node.js: v25.2.1
✅ pnpm: 10.27.0
✅ Git: git version 2.50.1
✅ 系统: Darwin 25.2.0 arm64
✅ macOS版本: 26.2
```

### 运行冒烟测试

```bash
./scripts/smoke-test.sh
```

这会测试:
- TypeScript 编译
- 主进程构建
- 预加载脚本
- 渲染进程

### 手动验证

1. **启动应用**
   ```bash
   pnpm dev
   ```

2. **检查主界面**
   - 主窗口应该正常打开
   - 可以看到插件列表
   - 没有控制台错误

3. **测试插件**
   - 尝试启用/禁用插件
   - 测试一个插件功能 (例如创建微信分身)

## 升级

### 从源码升级

```bash
# 拉取最新代码
git pull origin main

# 更新依赖
pnpm install

# 重新构建
pnpm build
```

### 从发布包升级

下载新版本的 `.dmg` 文件并安装,会覆盖旧版本。

**注意**: 升级前建议备份配置文件:

```bash
cp -r ~/.rokun-tool ~/.rokun-tool.backup
```

## 卸载

### 完全卸载

#### 步骤 1: 删除应用

```bash
# 如果从 .dmg 安装
rm -rf /Applications/RokunTool.app

# 如果从源码运行
cd ..  # 离开项目目录
rm -rf /path/to/RokunTool
```

#### 步骤 2: 删除配置和数据

```bash
# 删除用户配置
rm -rf ~/.rokun-tool

# 删除权限状态
rm -rf ~/.rokun-tool/permissions
```

#### 步骤 3: 删除全局包 (如果安装了)

```bash
npm uninstall -g rokun-tool
```

### 保留配置卸载

如果只想卸载应用但保留配置:

```bash
# 只删除应用
rm -rf /Applications/RokunTool.app

# 配置会保留在 ~/.rokun-tool
```

## 故障排除

### 问题: pnpm install 失败

**解决方案**:
```bash
# 清除缓存
pnpm store prune

# 重新安装
rm -rf node_modules
pnpm install
```

### 问题: Electron 无法启动

**解决方案**:
```bash
# 重新构建 Electron
pnpm rebuild

# 或删除 node_modules 重新安装
rm -rf node_modules
pnpm install
```

### 问题: 权限错误

**解决方案**:
```bash
# 确保有执行权限
chmod +x scripts/*.sh

# 如果使用 sudo 运行,重新设置文件所有者
sudo chown -R $USER:$USER ~/.rokun-tool
```

## 下一步

安装完成后:

1. 阅读 [快速开始](getting-started.md) 了解基本使用
2. 查看 [插件文档](../plugins/) 了解特定插件
3. 查看 [常见问题](faq.md) 解决问题

---

**需要帮助?** 请提交 Issue 或联系维护者。
