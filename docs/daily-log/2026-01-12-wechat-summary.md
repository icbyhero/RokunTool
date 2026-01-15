# 微信分身插件 - 每日开发总结

## 今日完成 (2026-01-12)

### 核心功能实现 ✅

1. **权限系统集成** ✅
   - 创建/删除/重建分身前请求权限
   - fs:write (文件写入)
   - process:exec (进程执行/签名)

2. **文件存储优化** ✅
   - 实际文件: `~/Applications/WeChat*.app` (无需 sudo)
   - 符号链接: `/Applications/WeChat*.app` (方便访问)

3. **应用签名改进** ✅
   - 4步签名流程
   - 清除扩展属性
   - 移除未密封文件
   - 签名 Contents → 签名整个应用

4. **分身命名** ✅
   - 从 WeChat3 开始编号
   - 中文显示:"微信3"、"微信4"
   - 修改本地化字符串

5. **分身标记系统** ✅
   - Info.plist 添加 `rokun-wechat-instance` 标记
   - `isWeChatInstance()` - 检查是否分身
   - `scanInstances()` - 扫描所有分身

6. **自动发现功能** ✅
   - 程序重装后自动恢复管理
   - 扫描 ~/Applications
   - 避免重复纳入

7. **分身重建功能** ✅
   - `rebuildInstance(instanceId)` 方法
   - 删除旧文件 → 基于新版本创建
   - 保留配置(id, createdAt)
   - 添加 rebuiltAt 时间戳

8. **版本自动检测** ✅
   - 配置文件保存微信版本
   - 加载时检测版本变化
   - `getWeChatVersionChange()` API

### Bug 修复 ✅

1. **权限对话框无效** ✅
   - 修复 IPC 通信不匹配
   - webContents.on → ipcMain.on

2. **进程管理错误** ✅
   - 移除 startInstance/stopInstance
   - 分身是独立应用,不需要插件管理

### 文档完善 ✅

1. ✅ README.md - 功能列表、使用场景、技术细节
2. ✅ CHANGELOG.md - 详细开发日志
3. ✅ 标注不实现的功能
4. ✅ 完整功能清单

## API 导出 (9个方法)

```javascript
// 核心方法
createInstance(context)          // 创建分身
deleteInstance(context, id)      // 删除分身
rebuildInstance(context, id)     // 重建分身
getInstances(context)            // 获取列表
getInstance(context, id)         // 获取单个

// 工具方法
checkWeChatInstalled(context)    // 检查安装
getWeChatVersion(context)        // 获取版本
getWeChatVersionChange(context)  // 版本变化

// 静态方法
isWeChatInstance(path)           // 检查是否分身
scanInstances()                  // 扫描所有分身
```

## 配置文件格式

```json
{
  "wechatVersion": "3.9.1",
  "instances": [
    {
      "id": "instance-1234567890",
      "name": "WeChat3",
      "path": "/Applications/WeChat3.app",
      "realPath": "/Users/xxx/Applications/WeChat3.app",
      "bundleId": "com.tencent.xinWeChat3",
      "createdAt": "2026-01-12T10:00:00.000Z",
      "rebuiltAt": "2026-01-12T12:00:00.000Z",
      "running": false,
      "autoDiscovered": false
    }
  ]
}
```

## 设计亮点

1. **符号链接方案** - 无需 sudo,用户可访问
2. **分身标记系统** - 可识别,可扩展
3. **自动发现机制** - 重装后自动恢复
4. **版本智能检测** - 主动提示重建
5. **保留配置重建** - 不丢失历史

## 不实现的功能

- ❌ 进程监控和状态管理
- ❌ 批量操作
- ❌ 分身重命名
- ❌ 数据目录管理
- ❌ 平台兼容性检测
- ❌ 高级 UI 交互

## 技术栈

- **语言**: JavaScript (Node.js)
- **框架**: Electron Plugin System
- **权限**: Permission Manager
- **签名**: codesign (macOS)
- **配置**: JSON 文件持久化

## 测试清单

- [ ] 创建分身 - 权限请求、符号链接、中文命名
- [ ] 删除分身 - 权限请求、删除符号链接和实际文件
- [ ] 重建分身 - 保留配置、基于新版本创建
- [ ] 自动发现 - 程序重装后自动恢复
- [ ] 版本检测 - 微信更新后提示
- [ ] 分身标记 - 其他插件可识别

## 后续优化

1. 磁盘空间检查
2. 签名验证
3. 错误恢复机制

**说明**: 只在实际遇到问题时实现。

---

## 相关文档

- [README.md](README.md) - 完整开发文档
- [CHANGELOG.md](CHANGELOG.md) - 详细开发日志
- [../../../openspec/specs/wechat-multi-instance/spec.md](../../../openspec/specs/wechat-multi-instance/spec.md) - 功能规范
