# RokunTool 文档

欢迎来到 RokunTool 文档中心!

## 🚀 快速开始

### 👤 用户文档

如果您是 RokunTool 的用户,想了解如何使用应用:

- **[入门指南](user/README.md)** - 快速了解 RokunTool
- **[安装说明](user/installation.md)** - 详细的安装步骤
- **[常见问题](user/faq.md)** - 查找常见问题的答案

### 👨‍💻 开发者文档

如果您想开发插件或贡献代码:

- **[开发指南](development/README.md)** - 开发者快速入门
- **[插件开发规范](development/standards/plugin-development.md)** - ⚠️ 必读
- **[权限系统 API](development/api/permissions.md)** - 权限 API 参考
- **[事务系统 API](development/api/transactions.md)** - 事务 API 参考

### 🔌 插件文档

查看现有插件的文档和示例:

- **[Rime 配置插件](plugins/rime-config/README.md)** - Rime 输入法配置管理
- **[微信分身插件](plugins/wechat-multi-instance/README.md)** - 微信多开管理

## 📚 文档结构

```
docs/
├── README.md                    # 📍 你在这里
├── user/                        # 👤 用户文档
├── development/                 # 👨‍💻 开发者文档
│   ├── standards/               # 📋 开发规范
│   ├── guides/                  # 📖 开发指南
│   ├── api/                     # 🔌 API 参考
│   └── architecture/            # 🏗️ 架构文档
└── plugins/                     # 🔌 插件文档
```

## 🎯 按角色查看

### 我是插件开发者

1. **必读**: [插件开发规范](development/standards/plugin-development.md)
2. **API**: [权限 API](development/api/permissions.md), [事务 API](development/api/transactions.md)
3. **架构**: [插件系统架构](development/architecture/plugin-system.md)
4. **示例**: [Rime 插件](plugins/rime-config/), [微信插件](plugins/wechat-multi-instance/)

### 我是主应用开发者

1. **规范**: [代码风格规范](development/standards/coding-style.md)
2. **架构**: [主应用架构](development/architecture/main-app.md)
3. **UI**: [UI 设计系统](UI-DESIGN-SYSTEM.md)
4. **API**: [插件上下文 API](development/api/plugin-context.md)

### 我是新贡献者

1. **入门**: [开发指南](development/README.md)
2. **环境**: [环境检查](development/guides/environment-check.md)
3. **GitHub**: [GitHub 配置](development/guides/github-setup.md)
4. **规范**: [开发规范总览](development/standards/overview.md)

## 🔍 搜索文档

### 按主题搜索

- **权限系统**: [权限 API](development/api/permissions.md)
- **事务系统**: [事务 API](development/api/transactions.md)
- **UI 组件**: [UI 设计系统](UI-DESIGN-SYSTEM.md)
- **插件架构**: [插件系统](development/architecture/plugin-system.md)

### 按文档类型搜索

- **规范**: [开发规范](development/standards/)
- **指南**: [开发指南](development/guides/)
- **API**: [API 参考](development/api/)
- **架构**: [架构文档](development/architecture/)

## 🆘 获取帮助

- 查看 [FAQ](user/faq.md)
- 提交 [Issue](https://github.com/icbyhero/RokunTool/issues)
- 加入讨论

---

**最后更新**: 2026-01-14
