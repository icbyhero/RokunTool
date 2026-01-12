# Change: 建立测试框架

## Why

当前项目已完成插件平台的核心功能实现(98/218任务),包括:
- 插件系统核心框架
- 微信分身插件
- Rime Plum 配方管理插件

但项目缺少测试体系,存在以下问题:
1. **无单元测试**: 核心模块(插件加载器、权限系统、IPC通信、服务层)没有测试覆盖
2. **无集成测试**: 插件加载/卸载流程、权限申请流程等关键用户流程未验证
3. **无性能基准**: 缺少启动时间、加载时间、内存占用等性能指标的基准测试
4. **质量保障缺失**: 无法在重构或优化时验证功能正确性

为了确保代码质量和项目可维护性,需要建立完整的测试框架。

## What Changes

- **建立测试框架基础设施**
  - 安装和配置 Vitest (单元测试框架)
  - 安装和配置 @testing-library/react (组件测试)
  - 安装和配置 Playwright (E2E测试)
  - 配置代码覆盖率工具 (c8/istanbul)

- **编写核心模块单元测试**
  - 插件加载器测试 (loader.test.ts)
  - 权限系统测试 (permission-manager.test.ts)
  - IPC通信测试 (handlers.test.ts)
  - 服务层测试 (fs, process, config, logger)
  - Rime插件测试 (recipe管理功能)

- **编写集成测试**
  - 插件加载/卸载流程测试
  - 权限申请流程测试
  - 插件方法调用流程测试

## Impact

- **Affected specs**:
  - `testing`: 新增测试规范(定义测试要求和覆盖率目标)

- **Affected code**:
  - `rokun-tool/vitest.config.ts` - 新增 Vitest 配置
  - `rokun-tool/src/main/**/*.test.ts` - 新增单元测试文件
  - `rokun-tool/src/renderer/**/*.test.ts` - 新增组件测试文件
  - `rokun-tool/tests/e2e/` - 新增 E2E 测试
  - `rokun-tool/package.json` - 添加测试脚本和依赖

- **Dependencies**:
  - vitest (测试框架)
  - @vitest/ui (测试UI)
  - @testing-library/react (组件测试)
  - @testing-library/jest-dom (DOM测试工具)
  - @testing-library/user-event (用户交互模拟)
  - playwright (E2E测试)
  - c8 (代码覆盖率)
  - happy-dom 或 jsdom (DOM环境)

- **Risks**:
  - 测试编写时间投入较大 → 优先覆盖核心功能,逐步扩展
  - E2E测试可能不稳定 → 使用可靠的等待和重试机制
  - 测试运行时间可能较长 → 优化测试并行执行,使用合理的测试隔离

## Success Criteria

- [ ] Vitest 配置完成,可以运行测试
- [ ] 核心模块单元测试覆盖率 > 60%
  - 插件加载器: > 70%
  - 权限系统: > 80%
  - IPC通信: > 70%
  - 服务层: > 60%
- [ ] E2E 测试覆盖主要用户流程
  - 应用启动流程
  - 插件加载流程
  - 权限申请流程
  - 插件方法调用流程
- [ ] 测试运行时间 < 30秒
- [ ] CI/CD集成就绪(测试可以自动化运行)

## Open Questions

1. 是否需要测试可视化UI(@vitest/ui)? → **可选**,优先保证命令行测试通过
2. 是否需要立即测试微信分身插件? → **Phase 2**,先测试Rime插件
3. 是否需要性能回归测试? → **Phase 3**,先建立基础测试
