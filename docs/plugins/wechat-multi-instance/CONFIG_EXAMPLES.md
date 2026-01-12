# 微信分身插件配置示例

本文件包含微信分身插件的各种配置示例和最佳实践。

## 📋 配置文件位置

```
~/Library/Application Support/RokunTool/plugins/wechat-multi-instance/instances.json
```

## 🔧 基础配置示例

### 最小配置

只包含必需的字段:

```json
{
  "version": "1.0.0",
  "instances": []
}
```

### 单实例配置

包含一个微信分身的配置:

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "工作号",
      "path": "/Applications/WeChat-工作号.app",
      "bundleId": "com.tencent.xin.work",
      "status": "stopped",
      "pid": null,
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-01-10T10:00:00.000Z"
    }
  ]
}
```

### 多实例配置

包含多个微信分身的配置:

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "工作号",
      "path": "/Applications/WeChat-工作号.app",
      "bundleId": "com.tencent.xin.work",
      "status": "stopped",
      "pid": null,
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-01-10T10:00:00.000Z"
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "name": "小号",
      "path": "/Applications/WeChat-小号.app",
      "bundleId": "com.tencent.xin.secondary",
      "status": "running",
      "pid": 12345,
      "createdAt": "2026-01-10T11:00:00.000Z",
      "updatedAt": "2026-01-10T12:30:00.000Z"
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c9",
      "name": "客服号",
      "path": "/Applications/WeChat-客服号.app",
      "bundleId": "com.tencent.xin.support",
      "status": "stopped",
      "pid": null,
      "createdAt": "2026-01-10T13:00:00.000Z",
      "updatedAt": "2026-01-10T13:00:00.000Z"
    }
  ]
}
```

## 📝 配置字段说明

### 根级别字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `version` | string | ✅ | 配置文件版本,遵循语义化版本 |
| `instances` | array | ✅ | 实例列表数组 |

### 实例对象字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 实例唯一标识符(UUID v4格式) |
| `name` | string | ✅ | 实例显示名称 |
| `path` | string | ✅ | 应用完整路径 |
| `bundleId` | string | ✅ | Bundle ID(反域名格式) |
| `status` | string | ✅ | 运行状态: `running` 或 `stopped` |
| `pid` | number\|null | ✅ | 进程ID,未运行时为 `null` |
| `createdAt` | string | ✅ | 创建时间(ISO 8601格式) |
| `updatedAt` | string | ✅ | 最后更新时间(ISO 8601格式) |

## 🎯 高级配置选项

### 自定义安装位置

默认情况下,应用安装到 `/Applications/`,但可以自定义:

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "工作号",
      "path": "/Users/john/Applications/WeChat-工作号.app",
      "bundleId": "com.tencent.xin.work",
      "status": "stopped",
      "pid": null,
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-01-10T10:00:00.000Z",
      "customPath": true
    }
  ]
}
```

### 启动参数

可以为每个实例配置不同的启动参数:

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "工作号",
      "path": "/Applications/WeChat-工作号.app",
      "bundleId": "com.tencent.xin.work",
      "status": "stopped",
      "pid": null,
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-01-10T10:00:00.000Z",
      "launchArgs": [
        "--background",
        "--no-startup-window"
      ],
      "env": {
        "WeChat_Debug": "1"
      }
    }
  ]
}
```

### 自动启动配置

配置实例在系统启动时自动启动:

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "工作号",
      "path": "/Applications/WeChat-工作号.app",
      "bundleId": "com.tencent.xin.work",
      "status": "stopped",
      "pid": null,
      "createdAt": "2026-01-10T10:00:00.000Z",
      "updatedAt": "2026-01-10T10:00:00.000Z",
      "autoStart": true,
      "autoStartDelay": 10
    }
  ]
}
```

字段说明:
- `autoStart`: 是否自动启动
- `autoStartDelay`: 延迟启动秒数

## 🎨 实例命名建议

### 推荐的命名模式

#### 1. 按用途命名

```json
{
  "instances": [
    {"name": "工作号"},
    {"name": "个人号"},
    {"name": "客服号"},
    {"name": "测试号"}
  ]
}
```

#### 2. 按项目命名

```json
{
  "instances": [
    {"name": "项目A"},
    {"name": "项目B"},
    {"name": "项目C"}
  ]
}
```

#### 3. 按客户命名

```json
{
  "instances": [
    {"name": "客户-腾讯"},
    {"name": "客户-阿里"},
    {"name": "客户-字节"}
  ]
}
```

#### 4. 混合命名

```json
{
  "instances": [
    {"name": "工作-项目A"},
    {"name": "工作-项目B"},
    {"name": "个人-主号"},
    {"name": "个人-小号"}
  ]
}
```

### 命名规范

- ✅ **允许**: 中文、英文、数字、下划线、连字符
- ✅ **长度**: 1-20个字符
- ❌ **禁止**: 特殊符号、空格、路径分隔符

## 🔐 Bundle ID命名规则

### 标准格式

```
com.tencent.xin.{suffix}
```

### 常用后缀

```json
{
  "instances": [
    {
      "name": "工作号",
      "bundleId": "com.tencent.xin.work"
    },
    {
      "name": "小号",
      "bundleId": "com.tencent.xin.secondary"
    },
    {
      "name": "客服",
      "bundleId": "com.tencent.xin.support"
    },
    {
      "name": "测试",
      "bundleId": "com.tencent.xin.test"
    },
    {
      "name": "开发",
      "bundleId": "com.tencent.xin.dev"
    }
  ]
}
```

### 自定义后缀建议

- 使用有意义的英文单词
- 保持简洁(不超过15个字符)
- 避免使用特殊字符
- 推荐使用小写字母

## 🚀 使用场景配置

### 场景1: 工作生活分离

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "name": "工作主号",
      "bundleId": "com.tencent.xin.work.main",
      "description": "日常工作沟通"
    },
    {
      "name": "工作小号",
      "bundleId": "com.tencent.xin.work.secondary",
      "description": "项目专用"
    },
    {
      "name": "个人",
      "bundleId": "com.tencent.xin.personal",
      "description": "私人社交"
    }
  ]
}
```

### 场景2: 客户服务

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "name": "售前咨询",
      "bundleId": "com.tencent.xin.presales",
      "autoStart": true
    },
    {
      "name": "售后服务",
      "bundleId": "com.tencent.xin.aftersales",
      "autoStart": true
    },
    {
      "name": "技术支持",
      "bundleId": "com.tencent.xin.support",
      "autoStart": true
    }
  ]
}
```

### 场景3: 社群运营

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "name": "社群1-科技",
      "bundleId": "com.tencent.xin.tech"
    },
    {
      "name": "社群2-金融",
      "bundleId": "com.tencent.xin.finance"
    },
    {
      "name": "社群3-教育",
      "bundleId": "com.tencent.xin.edu"
    },
    {
      "name": "个人",
      "bundleId": "com.tencent.xin.personal"
    }
  ]
}
```

## ⚙️ 环境变量配置

### 可用环境变量

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "name": "调试实例",
      "env": {
        "WeChat_Debug": "1",
        "WeChat_LogLevel": "verbose",
        "WeChat_DataDir": "/tmp/wechat-debug"
      }
    }
  ]
}
```

### 环境变量说明

| 变量 | 说明 | 值 |
|------|------|-----|
| `WeChat_Debug` | 启用调试模式 | `0` 或 `1` |
| `WeChat_LogLevel` | 日志级别 | `error`, `warn`, `info`, `debug`, `verbose` |
| `WeChat_DataDir` | 自定义数据目录 | 绝对路径 |

## 📊 配置模板

### 模板1: 最小化配置

适用于只需要1-2个分身的用户:

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "name": "工作",
      "bundleId": "com.tencent.xin.work"
    }
  ]
}
```

### 模板2: 标准配置

适用于一般用户:

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "name": "工作",
      "bundleId": "com.tencent.xin.work",
      "autoStart": false
    },
    {
      "name": "个人",
      "bundleId": "com.tencent.xin.personal",
      "autoStart": false
    }
  ]
}
```

### 模板3: 高级配置

适用于需要更多控制的用户:

```json
{
  "version": "1.0.0",
  "instances": [
    {
      "name": "工作主号",
      "bundleId": "com.tencent.xin.work.main",
      "autoStart": true,
      "autoStartDelay": 5,
      "launchArgs": ["--background"],
      "env": {
        "WeChat_Debug": "0"
      }
    },
    {
      "name": "工作小号",
      "bundleId": "com.tencent.xin.work.secondary",
      "autoStart": false
    },
    {
      "name": "个人",
      "bundleId": "com.tencent.xin.personal",
      "autoStart": true,
      "autoStartDelay": 10
    }
  ]
}
```

## 🔍 配置验证

### 验证命令

```bash
# 检查配置文件是否存在
test -f ~/Library/Application\ Support/RokunTool/plugins/wechat-multi-instance/instances.json

# 验证JSON格式
cat ~/Library/Application\ Support/RokunTool/plugins/wechat-multi-instance/instances.json | jq .

# 统计实例数量
cat ~/Library/Application\ Support/RokunTool/plugins/wechat-multi-instance/instances.json | jq '.instances | length'
```

### 常见问题

#### Q1: JSON格式错误

**检查方法**:
```bash
cat instances.json | jq .
```

**错误示例**:
```json
{
  "instances": [
    {
      "name": "工作"
      // 缺少逗号
    }
  ]
}
```

**正确格式**:
```json
{
  "instances": [
    {
      "name": "工作"
    }
  ]
}
```

#### Q2: 缺少必需字段

**验证脚本**:
```bash
jq '.instances[] | select(.id == null)' instances.json
```

#### Q3: 重复的ID

**检查方法**:
```bash
jq '.instances | map(.id) | group_by(.) | map(select(length > 1)) | flatten' instances.json
```

## 💾 配置备份和恢复

### 备份配置

```bash
# 备份配置文件
cp ~/Library/Application\ Support/RokunTool/plugins/wechat-multi-instance/instances.json \
   ~/Documents/wechat-instances-backup-$(date +%Y%m%d).json
```

### 恢复配置

```bash
# 恢复配置文件
cp ~/Documents/wechat-instances-backup-20260110.json \
   ~/Library/Application\ Support/RokunTool/plugins/wechat-multi-instance/instances.json
```

### 迁移配置

导出配置:
```bash
# 导出为可读格式
jq . instances.json > instances-formatted.json
```

导入配置:
```bash
# 导入并验证
jq . instances-import.json > instances.json
```

## 🎓 最佳实践

### 1. 定期备份

```bash
# 每周自动备份(添加到crontab)
0 0 * * 0 cp ~/Library/Application\ Support/RokunTool/plugins/wechat-multi-instance/instances.json ~/Documents/backup/wechat-$(date +\%Y\%m\%d).json
```

### 2. 版本控制

```bash
# 使用Git管理配置
cd ~/Documents/wechat-config
git add instances.json
git commit -m "Update instances"
git push
```

### 3. 配置模板

为不同场景创建模板:
- `instances-work.json` - 工作配置
- `instances-personal.json` - 个人配置
- `instances-test.json` - 测试配置

### 4. 文档化

在配置中添加注释(使用特殊字段):
```json
{
  "_comment": "工作用微信配置,包含3个实例",
  "_updated": "2026-01-10",
  "_version": "1.0.0",
  "instances": [...]
}
```

## 📚 相关文档

- [用户使用指南](README.md)
- [技术文档](TECHNICAL.md)
- [故障排除](README.md#故障排除指南)

---

**最后更新**: 2026-01-10
**版本**: 1.0.0
**作者**: Rokun
