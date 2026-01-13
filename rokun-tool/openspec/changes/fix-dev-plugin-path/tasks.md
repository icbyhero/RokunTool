# 修复开发环境插件路径 - 任务清单

## Phase 1: 代码修改 (P0)

### 1.1 修改插件路径计算
- [ ] 编辑 `src/main/index.ts:18`
- [ ] 添加环境检测: `const isDev = process.env.NODE_ENV === 'development'`
- [ ] 修改路径计算: 三元表达式选择正确路径
- [ ] 开发环境: `join(__dirname, '../../../plugins')`
- [ ] 生产环境: `join(__dirname, '../../plugins')`

### 1.2 添加调试日志
- [ ] 在插件系统初始化前添加日志
- [ ] 输出: `[Plugin System] Environment: ${process.env.NODE_ENV}`
- [ ] 输出: `[Plugin System] __dirname: ${__dirname}`
- [ ] 输出: `[Plugin System] Plugins directory: ${pluginsDir}`
- [ ] 验证: `fs.existsSync(pluginsDir)` 并输出结果

## Phase 2: 测试验证 (P0)

### 2.1 开发环境测试
- [ ] 运行 `pnpm dev`
- [ ] 检查控制台日志
- [ ] 验证插件列表显示
- [ ] 验证插件数量 (3-4 个)

### 2.2 生产环境测试
- [ ] 运行 `pnpm build`
- [ ] 运行构建后的应用
- [ ] 验证插件加载正常
- [ ] 确认功能无回归

### 2.3 功能测试
- [ ] 测试插件启用/禁用
- [ ] 测试微信分身插件
- [ ] 测试 Rime 配置插件
- [ ] 检查无控制台错误

## Phase 3: 文档和提交 (P1)

### 3.1 更新文档
- [ ] 更新开发日志 `docs/daily-log/2026-01-13.md`
- [ ] 记录问题和解决方案

### 3.2 提交代码
- [ ] Git add 修改文件
- [ ] Commit message: "fix: 修复开发环境插件加载路径问题"
- [ ] Push to GitHub

---

**预计时间**: 1 小时
**优先级**: P0 - 关键问题
