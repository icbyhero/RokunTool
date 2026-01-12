# GitHub 仓库创建和连接指南

## 步骤1: 在 GitHub 创建新仓库

### 1. 访问 GitHub

打开浏览器,访问 https://github.com

### 2. 创建新仓库

1. 点击右上角的 `+` 按钮
2. 选择 `New repository`
3. 填写仓库信息:
   - **Repository name**: `RokunTool` (或您喜欢的名称)
   - **Description**: `一个基于 Electron 的插件化桌面工具平台`
   - **Visibility**:
     - `Public` - 公开(任何人可见)
     - `Private` - 私有(仅您可见)
   - **Initialize this repository with**:
     - ❌ **不要勾选** "Add a README file"
     - ❌ **不要勾选** "Add .gitignore"
     - ❌ **不要勾选** "Choose a license"

4. 点击 `Create repository`

### 3. 获取仓库 URL

创建后,GitHub 会显示仓库 URL,格式如下:
```
https://github.com/你的用户名/RokunTool.git
```

## 步骤2: 连接本地仓库到 GitHub

### 方法1: 使用 HTTPS (推荐)

```bash
# 添加远程仓库
git remote add origin https://github.com/你的用户名/RokunTool.git

# 推送到 GitHub
git push -u origin main
```

### 方法2: 使用 SSH

如果已配置 SSH 密钥:

```bash
# 添加远程仓库
git remote add origin git@github.com:你的用户名/RokunTool.git

# 推送到 GitHub
git push -u origin main
```

## 步骤3: 验证

推送成功后:

1. 刷新 GitHub 页面
2. 应该能看到所有文件
3. 访问 `https://github.com/你的用户名/RokunTool` 查看仓库

## 常见问题

### Q: 提示 "Authentication failed"

**A**: 如果使用 HTTPS:
1. 创建 GitHub Personal Access Token:
   - Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Generate new token > 勾选 `repo` 权限
   - 复制 token

2. 使用 token 推送:
```bash
git push -u origin main
# 用户名: 输入 GitHub 用户名
# 密码: 粘贴 token (不是密码)
```

### Q: 提示 "remote origin already exists"

**A**:
```bash
# 移除现有远程仓库
git remote remove origin

# 重新添加
git remote add origin https://github.com/你的用户名/RokunTool.git
```

### Q: 想使用 SSH 但没有配置

**A**: 生成 SSH 密钥:
```bash
# 生成密钥
ssh-keygen -t ed25519 -C "你的邮箱@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 添加到 GitHub:
# Settings > SSH and GPG keys > New SSH key
# 粘贴公钥
```

## 后续操作

连接成功后,您可以:

1. **设置仓库描述** (在 GitHub Settings > Repository)
2. **添加主题标签** (如 electron, desktop-app, plugin-system)
3. **启用 GitHub Pages** (如果需要)
4. **设置分支保护** (建议保护 main 分支)

## 快速命令参考

```bash
# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add origin <URL>

# 修改远程仓库 URL
git remote set-url origin <URL>

# 首次推送
git push -u origin main

# 后续推送
git push

# 拉取更新
git pull origin main
```

---

**需要帮助?** 查看 [GitHub 文档](https://docs.github.com/en/repositories)
