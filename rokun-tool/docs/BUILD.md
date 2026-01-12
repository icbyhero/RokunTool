# 构建和打包指南

## 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 对于 macOS 打包，需要 Xcode 命令行工具
- 对于 Windows 打包，需要 Windows SDK
- 对于 Linux 打包，需要适当的构建工具

## 开发环境设置

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 测试

```bash
# 运行所有测试
pnpm test

# 运行测试并查看 UI
pnpm test:ui

# 监听模式运行测试
pnpm test:watch
```

## 构建

```bash
# 类型检查
pnpm typecheck

# 构建
pnpm build
```

## 打包

### 通用打包

```bash
# 构建但不打包（用于测试）
pnpm build:unpack

# 打包当前平台
pnpm build
```

### Windows

```bash
# 打包 Windows 版本
pnpm build:win

# 输出文件位于 `release` 目录
```

Windows 打包配置：
- NSIS 安装程序（x64 和 ia32）
- ZIP 压缩包（x64 和 ia32）

### macOS

```bash
# 打包 macOS 版本
pnpm build:mac

# 输出文件位于 `release` 目录
```

macOS 打包配置：
- DMG 镜像（x64 和 arm64）
- ZIP 压缩包（x64 和 arm64）

**macOS 签名和公证**：

```bash
# 配置签名证书（需要在环境变量中设置）
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"

# 打包并签名
pnpm build:mac

# 公证（需要 Apple 开发者账号）
electron-notarize \
  --tool-path node_modules/.bin/electron-notarize \
  --app-path "release/RokunTool-1.0.0-mac.dmg" \
  --bundle-id "com.rokun.tool" \
  --apple-id "your-apple-id" \
  --apple-id-password "your-app-specific-password"
```

### Linux

```bash
# 打包 Linux 版本
pnpm build:linux

# 输出文件位于 `release` 目录
```

Linux 打包配置：
- AppImage（x64 和 arm64）
- DEB 包（x64）

## 插件系统

插件位于 `plugins` 目录，打包时会自动包含。

### 插件结构

```
plugins/
├── wechat-multi-instance/
│   ├── index.js
│   └── package.json
└── rime-config/
    ├── index.js
    └── package.json
```

### 插件打包

插件会被自动打包到应用中，无需额外配置。

## CI/CD

### GitHub Actions

项目使用 GitHub Actions 进行自动化构建和测试。

### 工作流

- `.github/workflows/test.yml` - 自动化测试
- `.github/workflows/build.yml` - 自动化构建和打包
- `.github/workflows/release.yml` - 自动化发布

## 发布流程

1. 更新版本号：
   ```bash
   npm version patch  # 或 minor, major
   ```

2. 推送到 GitHub：
   ```bash
   git push && git push --tags
   ```

3. GitHub Actions 会自动：
   - 运行测试
   - 构建应用
   - 创建 GitHub Release
   - 上传构建产物

## 故障排除

### macOS

**问题**：打包失败，提示权限错误

**解决方案**：
```bash
# 确保具有正确的权限
sudo xcode-select --reset
```

**问题**：应用无法打开，提示"无法验证开发者"

**解决方案**：
```bash
# 右键点击应用 -> 打开
# 或者在系统偏好设置 -> 安全性与隐私中允许
```

### Windows

**问题**：打包失败，提示缺少 Windows SDK

**解决方案**：
```bash
# 安装 Windows SDK
# 下载地址：https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
```

**问题**：杀毒软件误报

**解决方案**：
```bash
# 代码签名需要购买证书
# 配置环境变量：
export WIN_CSC_LINK="path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"
```

### Linux

**问题**：依赖安装失败

**解决方案**：
```bash
# Ubuntu/Debian
sudo apt-get install -y libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1 libxkbcommon0 libasound2

# Fedora/RHEL
sudo dnf install -y gtk3 libnotify nss libXScrnSaver libXtst xdg-utils at-spi2-core libdrm libgbm libxkbcommon alsa-lib
```

## 资源文件

### 图标

- `build/icon.ico` - Windows 图标
- `build/icon.icns` - macOS 图标
- `build/icons/` - Linux 图标（PNG）

### 许可文件

- `build/entitlements.mac.plist` - macOS 权限配置

## 性能优化

1. **减小包体积**：
   - 使用 `--dir` 模式测试
   - 排除不必要的文件
   - 启用 ASAR 压缩

2. **加快构建速度**：
   - 使用 `--dir` 模式快速测试
   - 并行构建多平台
   - 缓存依赖

## 支持的平台

- Windows 10/11（x64, ia32）
- macOS 10.15+（x64, arm64）
- Linux（Ubuntu, Fedora, Debian 等）

## 联系方式

如有问题，请提交 Issue 或 Pull Request。
