# 测试权限请求对话框

## 测试步骤

### 1. 先撤销权限(如果已授予)

在开发者工具 Console 中执行:

```javascript
// 撤销 fs:write 权限
await window.electronAPI.permission.revoke({
  pluginId: 'test-plugin',
  permission: 'fs:write'
})
```

### 2. 检查权限状态

```javascript
// 查看权限状态
const status = await window.electronAPI.permission.getStatus({
  pluginId: 'test-plugin'
})
console.log('权限状态:', status)
```

**预期结果**: `fs:write` 应该显示为 `denied` 或不存在

### 3. 再次请求权限

```javascript
// 请求权限
window.electronAPI.permission.request({
  pluginId: 'test-plugin',
  permission: 'fs:write',
  reason: '测试权限请求对话框',
  context: {
    operation: '创建文件',
    target: '/tmp/test.txt'
  }
}).then(result => {
  console.log('权限请求结果:', result)
})
```

**预期结果**:
- ✅ 弹出权限请求对话框
- ✅ 对话框显示:
  - 标题: "test-plugin 请求权限"
  - 权限图标: 📁
  - 权限名称: "文件写入权限"
  - 权限描述: "允许插件在指定位置创建和修改文件"
  - 操作上下文: "操作: 创建文件 (/tmp/test.txt)"
  - 黄色安全提示卡片
  - 三个按钮: 取消 / 拒绝 / 允许
- ✅ 点击"允许"后,控制台显示 `granted: true`
- ✅ 点击"拒绝"后,控制台显示 `granted: false`

### 4. 测试其他敏感权限

```javascript
// 测试进程启动权限
window.electronAPI.permission.request({
  pluginId: 'test-plugin',
  permission: 'process:spawn',
  reason: '测试进程启动权限',
  context: {
    operation: '启动新进程'
  }
})
```

**预期结果**: 同样应该弹出对话框

### 5. 测试基础权限(应该自动授予)

```javascript
// 测试文件读取权限(基础权限)
window.electronAPI.permission.request({
  pluginId: 'test-plugin',
  permission: 'fs:read',
  reason: '测试文件读取权限'
}).then(result => {
  console.log('基础权限结果:', result)
})
```

**预期结果**:
- ❌ 不弹出对话框
- ✅ 立即返回 `granted: true`

---

## 如果对话框没有弹出

请检查以下内容:

### 1. 检查控制台日志

查看是否有以下日志:
- `收到权限请求: {...}`
- `发送权限响应: {...}`

### 2. 检查权限状态文件

```bash
cat ~/.rokun-tool/permissions/state.json
```

查看 `test-plugin` 的 `fs:write` 权限状态:
- 如果是 `"granted"` - 说明之前已授予,需要先撤销
- 如果是 `"denied"` - 应该会弹出对话框
- 如果不存在 - 应该会弹出对话框

### 3. 手动清除权限状态

```bash
# 删除权限状态文件
rm ~/.rokun-tool/permissions/state.json

# 或者编辑文件,将 test-plugin 的 fs:write 改为 "denied"
```

### 4. 重启应用

完全关闭应用后重新启动,再次测试。

---

## 预期对话框样式

对话框应该包含以下元素:

### 1. 标题栏
- 图标: 🔐
- 标题: "插件名称 请求权限"

### 2. 权限信息
- 大图标: 📁
- 权限名称: "文件写入权限"
- 权限描述: "允许插件在指定位置创建和修改文件"
- 状态标签: "敏感权限" (黄色)

### 3. 操作上下文
- 操作: "创建文件"
- 目标: "/tmp/test.txt"

### 4. 安全提示卡片
- 背景色: 黄色
- 图标: ⚠️
- 文字: "此权限允许插件在指定位置创建和修改文件。授予此权限可能存在安全风险,请确认你信任此插件。"

### 5. 按钮
- 取消 (灰色,左侧)
- 拒绝 (红色,中间)
- 允许 (绿色,右侧,primary)

---

## 测试检查清单

- [ ] 对话框成功弹出
- [ ] 对话框显示所有必要信息
- [ ] 权限图标正确显示
- [ ] 操作上下文正确显示
- [ ] 安全提示卡片显示
- [ ] 三个按钮都可点击
- [ ] 点击"允许"返回 `granted: true`
- [ ] 点击"拒绝"返回 `granted: false`
- [ ] 点击"取消"或 ESC 键关闭对话框
- [ ] 基础权限自动授予(不弹出对话框)
- [ ] 敏感权限需要用户确认(弹出对话框)
- [ ] 权限状态正确保存
- [ ] 权限历史记录正确更新
