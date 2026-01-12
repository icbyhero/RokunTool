# Rime 配置模板库

本文档提供常用的 Rime 配置模板,可以直接使用或根据需要修改。

## 📋 模板列表

1. [基础配置模板](#1-基础配置模板)
2. [输入方案模板](#2-输入方案模板)
3. [颜色主题模板](#3-颜色主题模板)
4. [标点符号模板](#4-标点符号模板)
5. [特殊功能模板](#5-特殊功能模板)

---

## 1. 基础配置模板

### 1.1 最小化配置

**default.yaml** - 适用于新手的最简配置:

```yaml
---
# 最小化默认配置
schema_list:
  - schema: luna_pinyin

switcher:
  hotkeys:
    - F4
  save_options:
    - full_shape
    - ascii_punct

key_binder:
  bindings:
    - {accept: Return, send: commit, when: has_menu}
```

### 1.2 推荐配置

**default.yaml** - 推荐的日常使用配置:

```yaml
---
schema_list:
  - schema: luna_pinyin
  - schema: terra_pinyin
  - schema: luna_pinyin_fluency

switcher:
  hotkeys:
    - F4
    - Control+grave
  fold_options: true
  abbreviate_options: true
  option_menu_separator: ' ['
  save_options:
    - full_shape
    - ascii_punct
    - simplification

style:
  color_scheme: aqua
  horizontal: true
  inline_preedit: true

menu:
  page_size: 5
```

---

## 2. 输入方案模板

### 2.1 朙月拼音优化版

**luna_pinyin_custom.schema.yaml**:

```yaml
---
schema:
  schema_id: luna_pinyin_custom
  name: 朙月拼音(优化)
  version: "1.0"

imports:
  - luna_pinyin

speller:
  max_code_length: 4
  auto_select: true
  auto_select_unique_candidate: true

menu:
  page_size: 7
```

### 2.2 双拼方案

**double_pinyin_flypy.schema.yaml**:

```yaml
---
schema:
  schema_id: double_pinyin_flypy
  name: 小鶴雙拼
  version: "0.19"
  author:
    - 鶴 <qqldd@gmail.com>
    - 東東轉 <zhoudonglin@live.com>

speller:
  alphabet: 'zyxwvutsrqponmlkjihgfedcba'
  delimiter: " ' "
  max_code_length: 2
  auto_select: true
  auto_select_unique_candidate: true

translator:
  dictionary: double_pinyin_flypy
  prism: double_pinyin_flypy
  preedit_format:
    - xform/([nl])v/$1ü/
```

### 2.3 五笔86方案

**wubi86.schema.yaml**:

```yaml
---
schema:
  schema_id: wubi86
  name: 五笔86
  version: "1.0"

speller:
  alphabet: 'abcdefghijklmnopqrstuvwxyz'
  max_code_length: 4
  auto_select: true
  auto_select_unique_candidate: true

translator:
  dictionary: wubi86
  prism: wubi86
  enable_completion: true
  enable_user_dict: true

reverse_lookup:
  dictionary: luna_pinyin
  prefix: "z"
  tips: "〔拼音〕"
```

---

## 3. 颜色主题模板

### 3.1 简约白色主题

**theme_light.yaml**:

```yaml
preset_color_schemes:
  light_simple:
    name: "简约白"
    back_color: 0xffffff
    text_color: 0x333333
    hilited_candidate_text_color: 0xffffff
    hilited_candidate_back_color: 0x4a90d9
    comment_text_color: 0x888888

style:
  color_scheme: light_simple
```

### 3.2 护眼暗色主题

**theme_dark.yaml**:

```yaml
preset_color_schemes:
  dark_protect:
    name: "护眼暗色"
    back_color: 0x2c2c2c
    text_color: 0xe0e0e0
    hilited_candidate_text_color: 0xffffff
    hilited_candidate_back_color: 0x4a90d9
    comment_text_color: 0x808080

style:
  color_scheme: dark_protect
  horizontal: true
```

### 3.3 Solarized 主题

**theme_solarized.yaml**:

```yaml
preset_color_schemes:
  solarized_light:
    name: "Solarized 浅色"
    back_color: 0xfdf6e3
    text_color: 0x657b83
    hilited_candidate_back_color: 0xeee8d5

  solarized_dark:
    name: "Solarized 深色"
    back_color: 0x002b36
    text_color: 0x839496
    hilited_candidate_back_color: 0x073642

style:
  color_scheme: solarized_light
```

---

## 4. 标点符号模板

### 4.1 标准中文标点

**punctuation_chinese.yaml**:

```yaml
---
punctuator:
  full_shape:
    " " : {commit: "　"}
    "," : {commit: "，"}
    "." : {commit: "。"}
    "?" : {commit: "？"}
    "!" : {commit: "！"}
    ":" : {commit: "："}
    ";" : {commit: "；"}
    "(" : {commit: "（"}
    ")" : {commit: "）"}
```

### 4.2 程序员标点

**punctuation_programmer.yaml**:

```yaml
---
punctuator:
  full_shape:
    "`" : {commit: "`"}
    "~" : {commit: "~"}
    "!" : {commit: "!"}
    "@" : {commit: "@"}
    "#" : {commit: "#"}
    "$" : {commit: "$"}
    "%" : {commit: "%"}
    "^" : {commit: "^"}
    "&" : {commit: "&"}
    "*" : {commit: "*"}
    "(" : {commit: "("}
    ")" : {commit: ")"}
    "_" : {commit: "_"}
    "+" : {commit: "+"}
    "=" : {commit: "="}
    "{" : {commit: "{"}
    "}" : {commit: "}"}
```

---

## 5. 特殊功能模板

### 5.1 表情符号输入

**emoji.schema.yaml**:

```yaml
---
schema:
  schema_id: emoji
  name: 表情符号
  version: "0.1"

recognizer:
  import_preset: default

translator:
  dictionary: emoji

# emoji.dict.yaml 示例:
# smile: 😊
# heart: ❤️
# ok: 👍
```

### 5.2 中英混输

**cn_en.schema.yaml**:

```yaml
---
schema:
  schema_id: cn_en_mix
  name: 中英混輸
  version: "1.0"

imports:
  - luna_pinyin

translator:
  dictionary: cn_en
  enable_completion: true

# cn_en.dict.yaml 示例:
# vpn: VPN
# api: API
# url: URL
```

### 5.3 简繁转换

**simplification.yaml**:

```yaml
---
schema:
  schema_id: simplified_traditional
  name: 簡繁轉換
  version: "1.0"

switches:
  - name: simplification
    reset: 1
    states: [ 简体, 繁體 ]

filters:
  - simplifier

simplifier:
  option_name: simplification
  opencc_config: t2s.json
```

---

## 🎯 使用方法

### 方法1: 复制使用

1. 复制模板文件到 Rime 用户目录
2. 根据需要修改配置
3. 部署配置

### 方法2: 通过插件导入

1. 打开 Rime 配置管理插件
2. 点击"导入模板"
3. 选择模板文件
4. 部署配置

### 方法3: 参考修改

1. 阅读模板了解配置结构
2. 在现有配置中参考使用
3. 逐步调整优化

---

## 📝 自定义建议

### 1. 渐进式配置

从简单开始:
- 先使用基础模板
- 逐步添加功能
- 根据需求调整

### 2. 备份原始配置

```bash
# 备份
cp -r ~/Library/Rime ~/Documents/Rime-Backup

# 恢复
cp -r ~/Documents/Rime-Backup/* ~/Library/Rime/
```

### 3. 版本控制

```bash
# 使用 Git 管理
cd ~/Library/Rime
git init
git add .
git commit -m "Initial config"
```

### 4. 测试验证

每次修改后:
1. 部署配置
2. 测试基本输入
3. 检查特殊功能
4. 查看错误日志

---

## 📚 更多资源

- [Rime 官方案例](https://github.com/rime/rime-ice)
- [社区配置分享](https://github.com/rime/home)
- [配置教程](./TUTORIAL.md)

---

**最后更新**: 2026-01-10
**版本**: 1.0.0
**作者**: Rokun
