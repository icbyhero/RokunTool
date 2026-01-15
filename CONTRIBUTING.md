# 贡献指南

感谢您对 RokunTool 的关注!我们欢迎任何形式的贡献。

## 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议:

1. 检查 [Issues](https://github.com/icbyhero/RokunTool/issues) 是否已存在相同问题
2. 如果没有,创建新的 Issue,包含:
   - 清晰的标题
   - 详细的描述
   - 复现步骤(针对 bug)
   - 预期行为 vs 实际行为
   - 环境信息(OS, Electron 版本等)
   - 截图或日志(如适用)

### 提交代码

#### 准备工作

1. **阅读必读文档**:
   - [插件开发规范](docs/development/standards/plugin-development.md) - 如果开发插件
   - [代码风格规范](docs/development/standards/coding-style.md) - 如果修改主应用
   - [UI 设计系统](docs/UI-DESIGN-SYSTEM.md) - 如果修改 UI

2. **Fork 仓库**:
   ```bash
   # Fork 并 clone 到本地
   git clone https://github.com/YOUR_USERNAME/RokunTool.git
   cd RokunTool
   git remote add upstream https://github.com/icbyhero/RokunTool.git
   ```

3. **安装依赖**:
   ```bash
   cd rokun-tool
   pnpm install
   ```

#### 开发流程

1. **创建分支**:
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

2. **编写代码**:
   - 遵循代码风格规范
   - 添加必要的注释
   - 更新相关文档

3. **测试**:
   ```bash
   # 运行类型检查
   pnpm typecheck
   
   # 运行 linter
   pnpm lint
   
   # 手动测试功能
   pnpm dev
   ```

4. **提交代码**:
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

   Commit message 规范:
   - `feat`: 新功能
   - `fix`: Bug 修复
   - `docs`: 文档更新
   - `style`: 代码格式
   - `refactor`: 重构
   - `test`: 测试
   - `chore`: 构建/工具

5. **推送并创建 PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

   然后在 GitHub 上创建 Pull Request

### Pull Request 检查清单

在提交 PR 前,请确认:

- [ ] 代码通过 TypeScript 类型检查
- [ ] 代码通过 ESLint 检查
- [ ] UI 组件在明暗主题下都正常显示
- [ ] 添加了必要的错误处理
- [ ] 添加了日志记录
- [ ] 更新了相关文档
- [ ] 编写了清晰的 commit message
- [ ] PR 描述清晰说明了变更内容

## 代码审查标准

### 安全性

- ✅ 权限检查是否正确?
- ✅ 是否遵循沙箱限制?
- ✅ 是否暴露敏感信息?

### 用户体验

- ✅ 进度报告是否清晰?
- ✅ 错误提示是否友好?
- ✅ UI 是否响应及时?

### 代码质量

- ✅ 是否遵循代码风格规范?
- ✅ TypeScript 类型是否正确?
- ✅ 是否有必要的注释?
- ✅ 是否易于维护?

### 测试

- ✅ 是否测试了正常流程?
- ✅ 是否测试了错误情况?
- ✅ 是否测试了边界情况?

## 行为准则

### 我们的承诺

为了营造开放和友好的环境,我们承诺:

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化语言或图像
- 人身攻击或政治攻击
- 公开或私下骚扰
- 未经许可发布他人私人信息
- 其他不专业或不适当的行为

## 获得帮助

### 文档

- [开发指南](docs/development/README.md) - 开发者快速入门
- [FAQ](docs/user/faq.md) - 常见问题

### Issue

如果您遇到问题:
1. 查看 [已有 Issues](https://github.com/icbyhero/RokunTool/issues)
2. 查看 [FAQ](docs/user/faq.md)
3. 创建新的 Issue

### 联系方式

- GitHub Issues: [https://github.com/icbyhero/RokunTool/issues](https://github.com/icbyhero/RokunTool/issues)

## 认可贡献者

我们会在 Release Notes 中感谢所有贡献者。

---

**再次感谢您的贡献!** 🎉

**最后更新**: 2026-01-15
