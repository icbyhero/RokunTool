# Rime 配置教程

本教程深入讲解 Rime 输入法的配置方法和技巧。

## 📚 配置基础

### Rime 配置文件结构

```
~/Library/Rime/                    # macOS 用户目录
├── default.yaml                   # 默认配置
├── user.yaml                      # 用户配置
├── luna_pinyin.schema.yaml       # 朙月拼音方案
├── luna_pinyin.dict.yaml         # 词典文件
├── luna_pinyin.prism.yaml        # 棱镜文件
├── symbols.yaml                  # 符号定义
├── emoji.yaml                    # 表情符号
├── custom_phrase.txt             # 用户自定义短语
├── user_db.txt                   # 用户词库
└── build/                        # 编译输出目录
```

### 配置文件类型

| 文件类型 | 扩展名 | 用途 | 示例 |
|---------|--------|------|------|
| 配置文件 | `.yaml` | 方案配置、全局设置 | `default.yaml` |
| 词典文件 | `.dict.yaml` | 词库定义 | `luna_pinyin.dict.yaml` |
| 棱镜文件 | `.prism.yaml` | 词典编译索引 | `luna_pinyin.prism.yaml` |
| 短语文本 | `.txt` | 用户自定义短语 | `custom_phrase.txt` |

### YAML 语法基础

```yaml
# 注释以 # 开头

key: value                        # 键值对
key:
  - item1                         # 列表
  - item2
nested:                           # 嵌套结构
  key1: value1
  key2: value2
```

**重要规则**:
- 使用空格缩进(不使用 Tab)
- 对齐方式要一致
- 大小写敏感
- `#` 后面是注释

## 🔧 核心配置选项

### 1. 全局配置 (default.yaml)

#### 1.1 外观设置

```yaml
# 候选窗口样式
style:
  color_scheme: aqua              # 主题方案
  horizontal: true                # 横向显示
  inline_preedit: true            # 内联编码
  corner_radius: 10               # 圆角半径
  border_height: 0                # 边框高度
  border_width: 0                 # 边框宽度
  line_spacing: 1                 # 行间距
  spacing: 10                     # 候选词间距
  font_point: 16                  # 字体大小
  label_font_point: 14            # 序号字体大小
  comment_font_point: 14          # 注释字体大小
  background_image:               # 背景图片
    file_name: background.png     # 图片文件名

# 方案选择器
switcher:
  hotkeys:                        # 切换快捷键
    - F4                          # F4
    - Control+grave               # Ctrl+`
  fold_options: true              # 折叠选项
  abbreviate_options: true        # 缩写选项名
  option_menu_separator: " ["     # 分隔符
  save_options:                   # 保存选项
    - full_shape                  # 全角/半角
    - ascii_punct                 # 标点
    - simplification              # 简繁
  caption: "〔方案選單〕"         # 标题

# 菜单
menu:
  page_size: 5                    # 每页候选数
  min_page_size: 3                # 最小候选数
  max_page_size: 10               # 最大候选数
  alternative_select_labels:      # 另选标签
    - 0
    - 1
    - 2
    - 3
    - 4
    - 5
    - 6
    - 7
    - 8
    - 9
```

#### 1.2 输入行为

```yaml
# 编辑器
editor:
  bindings:                       # 编辑快捷键
    Return: confirm               # 回车上屏
    Control+Return: commit_comment # Ctrl+Enter 上屏注释
    Shift+Return: commit_raw      # Shift+Enter 上屏原码
    semicolon: commit_comment     # 分号上屏注释
    bracket_left: commit_comment  # [ 上屏注释
    bracket_right: commit_comment # ] 上屏注释

# 输入模拟器
recognizer:
  import_preset: default          # 引入预设规则

# 过滤器
filters:
  - simplifier                    # 简化器
  - uniquifier                    # 去重
  - single_char_filter            # 单字过滤器
```

#### 1.3 快捷键

```yaml
# 快捷键定义
key_binder:
  bindings:
    # 自动上屏
    - {accept: "Control+p", send: Up, when: composing}
    - {accept: "Control+n", send: Down, when: composing}
    - {accept: "Control+b", send: Left, when: composing}
    - {accept: "Control+f", send: Right, when: composing}
    - {accept: "Control+a", send: Home, when: composing}
    - {accept: "Control+e", send: End, when: composing}
    - {accept: "Control+d", send: Delete, when: composing}
    - {accept: "Control+h", send: BackSpace, when: composing}
    - {accept: "Control+g", send: Escape, when: composing}
    - {accept: "Control+bracketleft", send: Escape, when: composing}
```

### 2. 方案配置 (schema.yaml)

#### 2.1 方案元信息

```yaml
# 方案说明
schema:
  schema_id: luna_pinyin          # 方案ID(唯一)
  name: 朙月拼音                   # 显示名称
  version: "0.22"                 # 版本号
  author:
    - 佛振 <chen.sst@gmail.com>   # 作者
  description: |
    朙月拼音採用拼音文字的設計理念，以拼音語句
    流暢的輸入為目標，適用於拼音輸入法習慣的
    使用者。
```

#### 2.2 译码器配置

```yaml
# 拼写运算
speller:
  alphabet: 'zyxwvutsrqponmlkjihgfedcba'  # 字母表
  delimiter: " ' "                         # 分隔符
  max_code_length: 5                       # 最大编码长度
  auto_select: true                        # 自动上屏
  auto_select_unique_candidate: true       # 唯一候选自动上屏

  # 拼写规则
  algebra:
    # 简拼(首字母)
    - erase/^xx$/                         # 消除 xx
    - derive/^([nl])v/$1ü/               # n/nv/l/lv 韵母
    - xform/([nl])v/$1ü/                 # v → ü
    - xform/\s/0/                         # 空格转为 0

    # 模糊音
    - derive/^([zcs])h/$1/               # zh/z, ch/c, sh/s
    - derive/^([zcs])([^h])/$1h$2/       # z/zh, c/ch, s/sh
    - derive/([nl])v/$1ü/                # nv/nü, lv/lü

    # 容错
    - derive/^([aoe])([iuo])/$1$1$2/    # ao/iao, ai/uai
    - derive/([iu])ng/$1gn/              # ing/ung, ong/ong
```

#### 2.3 翻译器配置

```yaml
# 翻译器
translator:
  dictionary: luna_pinyin                # 主词典
  prism: luna_pinyin                     # 棱镜
  preedit_format:                        # 预编辑格式
    - xform/([nl])v/$1ü/                # v → ü 显示
  comment_format:                        # 注释格式
    - xform/([nl])v/$1ü/                # v → ü 显示

  # 引入其他词库
  enable_completion: true                # 完成编码
  enable_user_dict: true                 # 启用用户词库
  enable_encoder: true                   # 启用编码

  # 最大词长和限制
  max_phrase_length: 5                   # 最大词组长度
  sentence_over_completion: true         # 句子优先

  # 过滤
  filters:
    - sdf_filter                         # 特殊符号过滤
```

#### 2.4 反查配置

```yaml
# 反查(通过其他输入法查词)
reverse_lookup:
  dictionary: stroke                     # 反查词典(五笔、笔画等)
  prefix: "`"                            # 反查前缀
  tips: "〔筆畫〕"                      # 提示文本
  preedit_format:                        # 反查编码格式
    - xlit/hspnz/一丨丿丶乙              # 笔画编码映射
  comment_format:                        # 反查注释格式
    - xform/([nl])v/$1ü/
```

### 3. 词典文件配置 (dict.yaml)

```yaml
---
name: luna_pinyin                        # 词典名称
version: "0.22"
sort: by_weight                          # 排序方式
use_preset_vocabulary: true              # 使用预设词汇
max_phrase_length: 5                     # 最大词长
import_tables:                           # 引入其他词典
  - luna_pinyin

# 词典格式
# 词语  权重  位置/注释
...
中国         100    中
中国人民      99     人民
...
```

## 🎨 常用配置选项详解

### 1. 颜色主题配置

```yaml
# 在 squirrel.yaml (macOS) 或 weasel.yaml (Windows) 中
style:
  color_scheme: custom_theme             # 自定义主题

  # 预设主题定义
  preset_color_schemes:
    aqua:                                # 青色主题
      name: 青色／Aqua
      author: 佛振
      back_color: 0xe0f0e0               # 背景色
      text_color: 0x000000               # 文字颜色
      candidate_text_color: 0x000000     # 候选词颜色
      hilited_candidate_text_color: 0xffffff # 高亮候选词
      hilited_candidate_back_color: 0x8abcd9 # 高亮背景
      comment_text_color: 0x448877       # 注释颜色
      hilited_comment_text_color: 0x000000 # 高亮注释

    dark:                                # 暗色主题
      name: "暗色/Dark"
      back_color: 0x333333
      text_color: 0xaaaaaa
      hilited_candidate_text_color: 0xffffff
      hilited_candidate_back_color: 0x4a90d9

    solarized_light:                     # Solarized 浅色
      name: "日间/Solarized Light"
      back_color: 0xfdf6e3
      text_color: 0x657b83
      hilited_candidate_back_color: 0xeee8d5

    solarized_dark:                      # Solarized 深色
      name: "夜间/Solarized Dark"
      back_color: 0x002b36
      text_color: 0x839496
      hilited_candidate_back_color: 0x073642
```

### 2. 标点符号配置

```yaml
# symbols.yaml 中定义标点
---
name: symbols
version: "0.1"
...
# 在 punctuation 半角标点
punctuator:
  full_shape:
    " " : {commit: "　"}                 # 空格
    "," : {commit: "，"}                 # 逗号
    "." : {commit: "。"}                 # 句号
    "?" : {commit: "？"}                 # 问号
    "!" : {commit: "！"}                 # 感叹号
    ":" : {commit: "："}                 # 冒号
    ";" : {commit: "；"}                 # 分号

  half_shape:
    "," : {commit: ","}                  # 逗号
    "." : {commit: "."}                  # 句号
    "?" : {commit: "?"}                  # 问号
    "!" : {commit: "!"}                  # 感叹号
```

### 3. 自定义短语

```yaml
# custom_phrase.yaml
---
name: custom_phrase
version: "1.0"
import_tables:
  - custom_phrase_main

# custom_phrase.txt 文件内容:
# 编码    文本        顺序(可选)
addr    北京市朝阳区   1
email   example@gmail.com
phone   13800138000
date    2026年1月10日
time    10:30
```

### 4. 简繁转换

```yaml
# 在方案中启用简繁转换
schema:
  schema_id: terra_pinyin
  name: 地球拼音
  ...
  switches:
    - name: simplification
      reset: 1                            # 默认启用
      states: [ 简体, 繁體 ]

# 引入简化器
filters:
  - simplifier

simplifier:
  option_name: simplification
  tips: all                              # 提示所有简繁对照
  opencc_config: t2s.json                # 简体→繁体转换配置

# 反向转换(繁→简)
# opencc_config: s2t.json
```

### 5. 中英混输

```yaml
# 引入英文词典
imports:
  - luna_pinyin
  - luna_pinyin.cn_en                    # 中英混输

# cn_en.dict.yaml
---
name: cn_en
version: "1.0"
sort: by_weight
use_preset_vocabulary: false
...
# 词典内容
...
vpn   VPN
api   API
url   URL
...
```

## 🚀 高级配置技巧

### 1. 动态键盘布局

```yaml
# editor/binders 支持动态切换
editor:
  bindings:
    # 输入数字时自动上屏
    - {when: has_menu, accept: space, send: space, toggle: space}
    - {when: composing, accept: space, send: Escape, toggle: space}
```

### 2. 条件分支

```yaml
# 使用 recognizers 实现条件匹配
recognizers:
  - script: latin_recognizer            # 识别拉丁字母
  - script: number_recognizer           # 识别数字
  - script: email_recognizer            # 识别邮箱
  - script: url_recognizer              # 识别URL
```

### 3. 嵌套方案

```yaml
# 方案可以继承其他方案
imports:
  - default                            # 默认配置
  - symbols                            # 符号定义
  - emoji                              # 表情符号

# 然后覆盖特定配置
translator:
  dictionary: my_custom_dict           # 使用自己的词典
```

### 4. 多环境配置

```yaml
# 通过条件判断区分环境
# (需要脚本支持)
switcher:
  hotkeys:
    - Control+grave

  # Windows 下使用不同的快捷键
  # (在 weasel.yaml 中覆盖)
```

## 📝 自定义配置示例

### 示例1: 优化后的朙月拼音

```yaml
# luna_pinyin.custom.yaml
---
schema:
  schema_id: luna_pinyin_optimized
  name: 朙月拼音(优化版)
  version: "1.0"

imports:
  - luna_pinyin                        # 继承原始方案

# 覆盖配置
speller:
  max_code_length: 4                   # 缩短最大码长
  auto_select: true                    # 自动上屏
  auto_select_unique_candidate: true

# 增加词库
translator:
  dictionary: luna_pinyin
  enable_completion: true
  enable_user_dict: true

  # 添加更多词库
  imports:
    - extra_dicts/cn_en                # 中英
    - extra_dicts/mobile               # 手机词库
    - extra_dicts/emoji                # 表情

# 优化候选
menu:
  page_size: 7                         # 每页7个候选

# 启用简繁
switches:
  - name: simplification
    reset: 1
    states: [ 简体, 繁體 ]
```

### 示例2: 五笔拼音混输

```yaml
# wubi_pinyin.schema.yaml
---
schema:
  schema_id: wubi_pinyin
  name: 五笔拼音混輸
  version: "1.0"

# 拼写运算
speller:
  alphabet: 'abcdefghijklmnopqrstuvwxyz'
  max_code_length: 4

# 翻译器配置
translator:
  dictionary: wubi86                    # 主用五笔

  # 混输拼音
  enable_completion: true

  # 配置拼音反查
  reverse_lookup:
    dictionary: luna_pinyin
    prefix: "z"
    tips: "拼音"

# 识别器
recognizers:
  - script: latin_recognizer
  - script: number_recognizer
```

### 示例3: 程序员专用方案

```yaml
# programmer.schema.yaml
---
schema:
  schema_id: programmer
  name: 程序員方案
  version: "1.0"

imports:
  - luna_pinyin

# 符号快速输入
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
    "[" : {commit: "["}
    "]" : {commit: "]"}
    "|" : {commit: "|"}
    "\\" : {commit: "\\"}
    ":" : {commit: ":"}
    "\"" : {commit: "\""}
    "<" : {commit: "<"}
    ">" : {commit: ">"}
    "?" : {commit: "?"}

# 常用代码片段
abbreviator:
  abbreviation:
    "for" : "for (int i = 0; i < n; i++)"
    "if" : "if ()"
    "while" : "while ()"
```

## 🔧 配方开发指南

### 创建新配方的基本步骤

#### 1. 定义方案元信息

```yaml
---
schema:
  schema_id: my_custom_schema
  name: 自定义方案
  version: "1.0"
  author:
    - Your Name <email@example.com>
  description: |
    方案描述
```

#### 2. 配置拼写运算

```yaml
speller:
  alphabet: 'abcdefghijklmnopqrstuvwxyz'
  delimiter: " ' "
  max_code_length: 5
  auto_select: true
  algebra:
    - erase/^xx$/
    - derive/^([nl])v/$1ü/
```

#### 3. 配置翻译器

```yaml
translator:
  dictionary: my_dict
  prism: my_dict
  enable_completion: true
  enable_user_dict: true
```

#### 4. 测试和调试

```bash
# 部署配置
^Control+Option+~  # macOS
^Control+`         # 其他

# 查看日志
tail -f ~/Library/Logs/Rime/
```

### 配方最佳实践

1. **使用 imports 复用配置**:
   ```yaml
   imports:
     - default
     - symbols
   ```

2. **提供完整的元信息**:
   ```yaml
   schema:
     schema_id: unique_id
     name: 显示名称
     version: "1.0"
     author: 作者信息
     description: 详细描述
   ```

3. **添加注释**:
   ```yaml
   # 这是一个注释
   key: value  # 行内注释
   ```

4. **版本控制**:
   ```yaml
   version: "1.0.0"  # 使用语义化版本
   ```

5. **测试覆盖**:
   - 测试基本输入
   - 测试特殊字符
   - 测试快捷键
   - 测试边界情况

## 📚 参考资料

### 官方文档

- [librime 开发指南](https://github.com/rime/librime/wiki)
- [配置指南](https://github.com/rime/librime-pguide)
- [方案开发指南](https://github.com/rime/rime-essay)

### 社区资源

- [配置示例](https://github.com/rime/home/wiki)
- [主题分享](https://github.com/rime/rime-atom-dark)
- [词库分享](https://github.com/rime/brise)

### 工具

- [Rime 配置生成器](https://rime-easy.github.io/)
- [词典转换工具](https://github.com/rime/brise)
- [主题预览](https://github.com/rime/rime-atom-dark)

---

**最后更新**: 2026-01-10
**版本**: 1.0.0
**作者**: Rokun
