# 权限流程测试指南

## 测试步骤:

1. **重启应用**
   ```bash
   # 停止当前应用
   # 重新启动应用
   pnpm dev
   ```

2. **打开开发者工具**
   - 主进程日志在终端
   - 渲染进程日志在 DevTools Console

3. **执行操作并观察日志**

### 测试创建微信分身:

1. 点击"创建微信分身"按钮
2. **应该看到以下日志:**

   **主进程终端:**
   ```
   [PermissionManager] 开始等待响应, requestId: xxx-xxx-xxx
   [PermissionManager] 注册权限响应监听器
   [PermissionManager] 发送权限请求事件到渲染进程: { id: ..., permission: 'fs:write', ... }
   [PermissionManager] 权限请求事件已发送
   ```

   **渲染进程 DevTools Console:**
   ```
   [App] 收到权限请求事件: { id: ..., permission: 'fs:write', ... }
   ```

3. **点击"允许"按钮**

   **渲染进程 DevTools Console:**
   ```
   发送权限响应: { granted: true, requestId: xxx-xxx-xxx }
   ```

   **主进程终端:**
   ```
   [PermissionManager] 收到权限响应: { requestId: xxx-xxx-xxx, granted: true }
   [PermissionManager] 响应ID匹配,解析Promise
   [PermissionManager] 授予权限: { pluginId: 'rokun-wechat-multi-instance', permission: 'fs:write', source: 'user' }
   [PermissionManager] PermissionService 已更新
   [PermissionManager] 权限状态已保存
   [PermissionManager] 权限授予完成
   ```

4. **检查权限文件**
   ```bash
   cat "/Users/rokun/Library/Application Support/rokun-tool/permissions/granted.json"
   ```

   应该看到:
   ```json
   [
     {
       "pluginId": "rokun-wechat-multi-instance",
       "permissions": ["fs:write"],
       "grantedAt": "2026-01-12T..."
     }
   ]
   ```

## 可能的问题和解决方案:

### 问题1: 看不到 "[App] 收到权限请求事件"

**原因:** 渲染进程还没有注册监听器

**解决方案:** 检查 App.tsx 中的 useEffect 是否正确执行

### 问题2: 点击"允许"后主进程没有收到响应

**原因:** ipcRenderer.send 没有正确发送事件

**解决方案:** 检查 preload/ipc.ts 中的 sendResponse 实现

### 问题3: 主进程收到响应但ID不匹配

**原因:** requestId 在传递过程中丢失或改变

**解决方案:** 检查整个流程中的 requestId 传递

### 问题4: 权限授予成功但文件没有保存

**原因:** PermissionService 或 PermissionStore 保存失败

**解决方案:** 检查文件系统权限和路径
