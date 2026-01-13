# 配方安装追踪规格增量

## ADDED Requirements

### Requirement: 配方安装标记文件

插件MUST为每个通过插件安装的配方创建标记文件,用于准确追踪安装状态。

#### Scenario: 创建安装标记文件

- **当** 配方安装成功后
- **则** MUST在 Rime 用户目录创建标记文件 `.recipe-{recipeId}.installed`
- **并且** 标记文件MUST包含 JSON 格式的元数据:
  - `recipeId`: 配方唯一标识
  - `installedAt`: 安装时间 (ISO 8601 格式)
  - `version`: 标记文件版本
- **并且** 文件MUST使用 UTF-8 编码
- **并且** 文件MUST使用 Unix 换行符 (LF)

#### Scenario: 标记文件格式

- **假设** 用户安装配方 `rime_ice`
- **当** 创建标记文件时
- **则** 文件名为 `.recipe-rime_ice.installed`
- **并且** 文件内容格式为:
```json
{
  "recipeId": "rime_ice",
  "installedAt": "2026-01-13T10:30:00.000Z",
  "version": "1.0"
}
```

#### Scenario: 删除安装标记文件

- **当** 用户卸载配方时
- **则** MUST删除对应的标记文件 `.recipe-{recipeId}.installed`
- **并且** 如果标记文件不存在,不应报错
- **并且** MUST记录删除日志

---

### Requirement: 配方安装状态检测

插件MUST使用混合检测机制确定配方安装状态。

#### Scenario: 优先检查标记文件

- **当** 检测配方安装状态时
- **则** MUST优先检查标记文件 `.recipe-{recipeId}.installed`
- **并且** 如果标记文件存在,配方MUST标记为已安装
- **并且** MUST不执行文件系统扫描

#### Scenario: 回退到特征文件检测

- **假设** 标记文件 `.recipe-{recipeId}.installed` 不存在
- **当** 检测配方安装状态时
- **则** MUST回退到特征文件检测
- **并且** MUST扫描 Rime 用户目录中的文件
- **并且** MUST根据配方定义的特征文件判断是否已安装
- **并且** 检测结果MUST用于显示安装状态

#### Scenario: 混合检测的优势

- **假设** 用户通过命令行手动安装了配方
- **当** 插件检测配方状态时
- **则** 即使没有标记文件,特征文件检测MUST能识别配方
- **并且** 用户MUST能看到正确的安装状态
- **并且** 标记文件提供了更准确的安装追踪

---

### Requirement: 特征文件检测规则

每个配方MUST定义用于回退检测的特征文件列表。

#### Scenario: 定义词库配方的特征文件

- **当** 定义词库配方时
- **则** MUST定义特征文件:
  - `rime_ice` → `rime_ice.dict.yaml`
  - `essay` → `essay.dict.yaml`
  - `octagram` → `octagram.dict.yaml`

#### Scenario: 定义输入方案配方的特征文件

- **当** 定义输入方案配方时
- **则** MUST定义特征文件:
  - `luna_pinyin` → `luna_pinyin.schema.yaml`
  - `terra_pinyin` → `terra_pinyin.schema.yaml`
  - `wubi` → `wubi86.schema.yaml` 或 `wubi.schema.yaml`
  - `cangjie` → `cangjie.schema.yaml`

#### Scenario: 定义工具配方的特征文件

- **当** 定义工具配方时
- **则** MUST定义特征文件:
  - `prelude` → `default.custom.yaml`
  - `opencc` → `t2s.json` 或 `s2t.json`
  - `emoji` → `emoji.schema.yaml`

---

## MODIFIED Requirements

无。

---

## REMOVED Requirements

无。
