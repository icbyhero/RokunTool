# Rime 配置管理插件使用指南

## 📖 什么是 Rime?

[Rime](https://rime.im/) (中州韵输入法引擎) 是一款跨平台的输入法引擎,具有以下特点:

- ✅ **高度可定制** - 完全可配置的输入方案
- ✅ **跨平台支持** - Windows、macOS、Linux
- ✅ **开源免费** - 完全开源,自由使用
- ✅ **丰富的词库** - 海量词库和方案支持
- ✅ **扩展性强** - 支持自定义方案和脚本

## 🎯 插件功能

Rime 配置管理插件提供了可视化的 Rime 配置管理界面,让你无需手动编辑配置文件。

### 核心功能

#### 1. 配方 (Recipe) 管理

- **浏览配方市场** - 查看可用的输入方案
- **一键安装** - 快速安装喜欢的方案
- **更新配方** - 获取最新版本的方案
- **卸载配方** - 移除不需要的方案

#### 2. 配置文件编辑

- **可视化编辑** - 图形界面编辑配置
- **语法高亮** - 配置文件语法高亮显示
- **实时验证** - 检查配置语法错误
- **配置备份** - 自动备份配置文件

#### 3. 词库管理

- **查看词库** - 浏览已安装的词库
- **下载词库** - 从网络获取新词库
- **更新词库** - 更新词库到最新版本
- **导入导出** - 管理自定义词库

## 💻 系统要求

### 支持的操作系统

- **macOS**: 10.15+ (推荐使用 Squirrel 鼠须管)
- **Linux**: Ubuntu 20.04+ (推荐使用 fcitx5-rime 或 ibus-rime)
- **Windows**: Windows 10+ (推荐使用小狼毫)

### Rime 安装

#### macOS 安装 Squirrel

1. 下载 [Squirrel](https://rime.im/download/)
2. 解压并拖拽到 `/Applications`
3. 运行 Squirrel,在菜单栏配置输入法
4. 切换到 Rime 输入法

#### Linux 安装 fcitx5-rime

```bash
# Ubuntu/Debian
sudo apt install fcitx5-rime

# Fedora
sudo dnf install fcitx5-rime

# Arch Linux
sudo pacman -S fcitx5-rime
```

#### Windows 安装小狼毫

1. 下载 [小狼毫](https://rime.im/download/)
2. 运行安装程序
3. 重启计算机
4. 在输入法设置中添加 Rime

## 🚀 快速开始

### 1. 安装插件

1. 打开 RokunTool 应用
2. 进入"插件市场"
3. 找到"Rime 配置管理"插件
4. 点击"安装"

### 2. 首次配置

插件首次启动时会:

1. 自动检测 Rime 安装目录
2. 加载已安装的配方
3. 显示配置文件列表

### 3. 配置 Rime 目录

如果自动检测失败,可以手动配置:

```
macOS: ~/Library/Rime
Linux (fcitx5): ~/.local/share/fcitx5/rime
Linux (ibus): ~/.config/ibus/rime
Windows: %APPDATA%\Rime
```

## 📱 界面说明

### 主界面

插件主界面包含以下标签页:

#### 📦 配方市场

浏览和安装 Rime 配方:

```
┌─────────────────────────────────────┐
│  配方市场                    [搜索]  │
├─────────────────────────────────────┤
│  🎯 朙月拼音   ⭐ 4.8k  [安装]       │
│     简体拼音输入方案,智能整句输入   │
├─────────────────────────────────────┤
│  🎯 地球拼音   ⭐ 2.3k  [安装]       │
│     简繁转换,拼音输入               │
├─────────────────────────────────────┤
│  🎯 五笔86     ⭐ 1.8k  [安装]       │
│     五笔字型86版方案                │
└─────────────────────────────────────┘
```

#### 📝 配置编辑器

编辑 Rime 配置文件:

```
┌─────────────────────────────────────┐
│  配置编辑器        [保存] [部署]    │
├─────────────────────────────────────┤
│  文件:                              │
│  ○ default.yaml                     │
│  ○ user.yaml                        │
│  ○ luna_pinyin.schema.yaml         │
├─────────────────────────────────────┤
│  editor:                            │
│    font_face: "PingFang SC"        │
│    font_point: 18                   │
│    line_spacing: 1                  │
└─────────────────────────────────────┘
```

#### 📚 词库管理

管理词库文件:

```
┌─────────────────────────────────────┐
│  词库管理              [更新全部]    │
├─────────────────────────────────────┤
│  📄 词汇名称    大小    更新时间     │
│  luna_pinyin  5.2MB   2026-01-10    │
│                                   [更新] │
│  terra_pinyin 3.8MB   2026-01-08    │
│                                   [更新] │
└─────────────────────────────────────┘
```

## 🎨 使用指南

### 安装输入方案

#### 方法1: 从配方市场安装

1. 进入"配方市场"标签
2. 浏览或搜索想要的方案
3. 点击"安装"按钮
4. 等待下载完成
5. 点击"部署"应用方案

#### 方法2: 从本地文件安装

1. 点击"导入配方"按钮
2. 选择 `.yaml` 配置文件
3. 确认导入
4. 部署配置

### 编辑配置文件

#### 基本编辑

1. 进入"配置编辑器"标签
2. 选择要编辑的文件
3. 在编辑器中修改配置
4. 点击"保存"按钮
5. 点击"部署"应用更改

#### 常用配置选项

**修改外观**:

```yaml
# default.yaml
style:
  color_scheme: aqua        # 主题颜色
  horizontal: true          # 横向候选框
  inline_preedit: true      # 内联编码
  corner_radius: 5          # 圆角
  border_height: 2          # 边框宽度
  border_width: 2           # 边框高度
```

**修改输入行为**:

```yaml
# default.yaml
switcher:
  hotkeys:
    - F4                    # 方案切换键
    - Control+grave         # 或 Control+`
  save_options:
    - full_shape            # 保存全角/半角状态
    - simplification        # 保存简繁转换状态
  abbreviate_options: true  # 缩写选项
  option_menu_format:      # 菜单格式
    - "选项"
    - "☕ $option"
```

**添加词库**:

```yaml
# luna_pinyin.schema.yaml
translator:
  dictionary: luna_pinyin    # 主词库
  prism: luna_pinyin         # 棱镜
  preedit_format:            # 预编辑格式
    - xform/([nl])v/$1/      # n/nv/l/lv 韵母

# 添加更多词库
imports:
  - extra_dicts              # 额外词库

# 在 extra_dicts.yaml 中:
---
tables:
  - name: luna_pinyin        # 主词库
  - name: cn_en             # 中英混输
  - name: mobile            # 手机词库
  - name: emoji             # 表情符号
```

### 词库管理

#### 更新词库

1. 进入"词库管理"标签
2. 找到要更新的词库
3. 点击"更新"按钮
4. 等待更新完成

#### 下载新词库

1. 点击"获取词库"按钮
2. 浏览可用的词库列表
3. 选择需要的词库
4. 点击"下载"

#### 导入自定义词库

1. 点击"导入词库"按钮
2. 选择词库文件 (`.txt` 或 `.dict.yaml`)
3. 设置词库名称和ID
4. 确认导入

### 部署配置

**什么是部署?**

部署是指重新编译 Rime 配置,使修改生效。

**何时需要部署?**

- ✅ 修改配置文件后
- ✅ 安装新方案后
- ✅ 更新词库后
- ✅ 添加新文件后

**如何部署?**

1. 点击工具栏的"部署"按钮
2. 或使用快捷键 `Control+Option+~` (macOS)
3. 等待部署完成(通常几秒钟)
4. 重新激活输入法

## 🎯 常见使用场景

### 场景1: 安装并使用地球拼音

**目标**: 使用支持简繁转换的拼音输入方案

**步骤**:

1. 进入"配方市场"
2. 搜索"地球拼音" (terra_pinyin)
3. 点击"安装"
4. 安装完成后点击"部署"
5. 切换输入法,使用 `Control+` 或 `F4` 切换到地球拼音
6. 开始输入!

**特性**:
- 自动简繁转换
- 支持简体入繁体出
- 支持繁体入简体出
- 可配置转换规则

### 场景2: 自定义候选框颜色

**目标**: 修改候选框为暗色主题

**步骤**:

1. 进入"配置编辑器"
2. 选择 `weasel.yaml` (Windows) 或 `squirrel.yaml` (macOS)
3. 添加或修改颜色配置:

```yaml
style:
  color_scheme: dark
  preset_color_schemes:
    dark:
      name: "暗色/Dark"
      author: "Your Name"
      back_color: 0x2c2c2c           # 背景色
      text_color: 0xe0e0e0           # 文字颜色
      hilited_candidate_text_color: 0xffffff  # 高亮文字
      hilited_candidate_back_color: 0x4a4a4a  # 高亮背景
      comment_text_color: 0x808080   # 注释颜色
    ...
```

4. 保存并部署
5. 重新激活输入法查看效果

### 场景3: 添加表情符号输入

**目标**: 输入 emoji 表情

**步骤**:

1. 进入"配方市场"
2. 搜索并安装"emoji"方案
3. 在主方案中引入 emoji:

```yaml
# luna_pinyin.schema.yaml
recognizers:
  - scripts:                    # 脚本匹配
    - match: "^:.*$"           # 冒号开头
      accept: emoji             # 使用 emoji 译码器
    - match: "^`.*$"           # 反引号开头
      accept: expression       # 使用表达式译码器
```

4. 部署配置
5. 输入 `:smile` → 😊
6. 输入 `:heart` → ❤️

### 场景4: 创建个人词库

**目标**: 添加专业术语词库

**步骤**:

1. 准备词库文件 `custom_terms.txt`:

```
# 自定义词库
# 格式: 词汇(可选空格)频率(可选权重)
云计算 100
大数据 100
人工智能 100
机器学习 100
深度学习 100
```

2. 进入"词库管理"
3. 点击"导入词库"
4. 选择文件并设置ID为 `custom_terms`
5. 在方案中引用:

```yaml
# luna_pinyin.schema.yaml
imports:
  - custom_terms               # 导入词库

# 或在 custom_terms.dict.yaml 中:
---
name: custom_terms
version: "1.0"
sort: by_weight
use_preset_vocabulary: false
import_tables:
  - luna_pinyin                # 基于主词库
max_phrase_length: 4
...
```

6. 部署配置
7. 开始使用自定义词汇

## 🔧 高级功能

### 配置文件优先级

Rime 配置文件按以下优先级加载:

```
1. 用户配置 (~/Library/Rime/user.yaml)
   ↓
2. 方案配置 (luna_pinyin.schema.yaml)
   ↓
3. 默认配置 (default.yaml)
   ↓
4. 预设配置 (内置)
```

**规则**:
- 用户配置 > 方案配置 > 默认配置
- 后加载的覆盖先加载的
- 可以在方案中引用默认配置

### 配置片段

使用 `imports` 引用其他配置:

```yaml
# 在你的方案中
imports:
  - default                   # 引入默认配置
  - extra_dicts              # 引入词库配置
  - my_custom                # 引入自定义配置
```

### 条件判断

配置中支持条件语句:

```yaml
switcher:
  hotkeys:
    - Control+grave
  # 根据平台设置不同的快捷键
  # (需要脚本支持)
```

### 多环境配置

为不同环境设置不同配置:

```yaml
# 可以通过软链接实现
ln -s default_windows.yaml default.yaml  # Windows
ln -s default_mac.yaml default.yaml      # macOS
```

## ❓ 常见问题解答

### Q1: 部署后输入法没有变化?

**A**: 尝试以下步骤:

1. 确认部署成功(查看日志)
2. 完全退出输入法(从进程管理器)
3. 重新启动输入法
4. 切换到其他方案再切换回来
5. 检查配置文件语法是否正确

### Q2: 词库不生效?

**A**: 检查:

1. 词库文件是否在正确位置
2. 词库文件名是否正确
3. 方案配置中是否引用词库
4. 词库文件格式是否正确
5. 是否已部署配置

### Q3: 输入法崩溃怎么办?

**A**: 故障排除:

1. 检查配置文件语法
2. 查看崩溃日志
3. 恢复备份配置
4. 禁用最近安装的方案
5. 重置输入法

```bash
# macOS 重置 Squirrel
rm ~/Library/Preferences/com.googlecode.rimeime.Squirrel.plist
killall Squirrel

# 重新打开 Squirrel
open /Applications/Squirrel.app
```

### Q4: 如何备份配置?

**A**: 备份方法:

1. 使用插件的备份功能
2. 手动复制 Rime 目录:

```bash
# macOS
cp -r ~/Library/Rime ~/Documents/Rime-Backup-$(date +%Y%m%d)

# Linux
cp -r ~/.local/share/fcitx5/rime ~/Documents/Rime-Backup-$(date +%Y%m%d)

# Windows
# 复制 %APPDATA%\Rime 到备份位置
```

3. 使用 Git 管理配置:

```bash
cd ~/Library/Rime
git init
git add .
git commit -m "Initial config"
git remote add origin <your-repo>
git push -u origin main
```

### Q5: 如何同步配置到多台设备?

**A**: 同步方案:

1. **使用云同步**:
   - Dropbox/iCloud/OneDrive
   - 将 Rime 目录放在云同步文件夹
   - 使用软链接

```bash
# macOS Dropbox 示例
mv ~/Library/Rime ~/Dropbox/Rime
ln -s ~/Dropbox/Rime ~/Library/Rime
```

2. **使用 Git**:
   - 创建 Git 仓库
   - 推送到 GitHub/GitLab
   - 在其他设备克隆

3. **使用插件**:
   - 导出配置包
   - 在其他设备导入

### Q6: 哪些输入方案推荐?

**A**: 推荐方案:

**拼音用户**:
- 朙月拼音 (luna_pinyin) - 基础拼音
- 地球拼音 (terra_pinyin) - 简繁转换
- 自然码双拼 (double_pinyin_flypy) - 双拼输入

**形码用户**:
- 五笔86 (wubi86) - 经典五笔
- 仓颉 (cangjie5) - 仓颉输入
- 郑码 (zhengma) - 郑码输入

**特殊需求**:
- 地球拼音 - 简繁转换
- 中俄混输 - 多语言输入
- emoji - 表情符号输入

### Q7: 如何提高输入效率?

**A**: 优化建议:

1. **使用简拼**:
   - 输入首字母: `zh` → `中国`
   - 自动词组匹配

2. **自定义词库**:
   - 添加常用词汇
   - 设置合理的频率

3. **使用快捷键**:
   - `Ctrl+`` 或 `F4` - 切换方案
   - `Ctrl+Shift+K` - 重新部署
   - `~` - 以词定字

4. **调整候选词数量**:
   ```yaml
   menu:
     page_size: 5               # 每页候选数
   ```

5. **启用模糊音**:
   ```yaml
   speller/algebra:
     - abbrev/^([a-z]).+$4/$1/  # 首字母简拼
     - derive/^([zcs])h/$1/    # zh/z, ch/c, sh/s 模糊
   ```

### Q8: 支持哪些语言?

**A**: 支持的语言:

- ✅ 简体中文
- ✅ 繁体中文
- ✅ 中国少数民族文字(藏文、蒙文等)
- ✅ 日语(罗马字)
- ✅ 韩语
- ✅ 俄语
- ✅ 越南语
- ✅ 粤语拼音
- ✅ 吴语拼音

通过安装相应的输入方案即可使用。

## 🛠️ 故障排除

### 问题1: 无法检测到 Rime 目录

**症状**: 提示"未检测到 Rime 安装"

**解决方案**:

1. 手动指定目录:

```bash
# macOS
ls -la ~/Library/Rime

# Linux fcitx5
ls -la ~/.local/share/fcitx5/rime

# Linux ibus
ls -la ~/.config/ibus/rime
```

2. 确认 Rime 已正确安装:

```bash
# macOS
ps aux | grep Squirrel

# Linux
ps aux | grep fcitx5
```

3. 重启插件和应用

### 问题2: 配置文件保存失败

**症状**: 点击保存后提示错误

**可能原因**:
- 文件权限问题
- 磁盘空间不足
- 配置文件被锁定

**解决方案**:

```bash
# 检查权限
ls -la ~/Library/Rime/*.yaml

# 修复权限
chmod 644 ~/Library/Rime/*.yaml

# 检查磁盘空间
df -h
```

### 问题3: 部署失败

**症状**: 点击部署后长时间无响应

**解决方案**:

1. 查看日志:
   - macOS: `~/Library/Logs/Rime/`
   - Linux: `~/.local/share/fcitx5/rime/`

2. 检查配置语法:
   - YAML 缩进必须正确
   - 使用插件的自带验证功能

3. 禁用问题方案:
   - 移动可疑方案文件到其他目录
   - 重新部署

### 问题4: 词库下载失败

**症状**: 点击下载后提示网络错误

**解决方案**:

1. 检查网络连接
2. 尝试使用国内镜像
3. 手动下载词库文件:
   - 访问 [Rime 词库](https://github.com/rime/librime-pguide)
   - 下载词库文件
   - 使用插件的导入功能

## 📞 技术支持

### 获取帮助

- **官方文档**: [https://github.com/rime/librime-pguide](https://github.com/rime/librime-pguide)
- **社区论坛**: [https://rime.im/discuss/](https://rime.im/discuss/)
- **问题反馈**: GitHub Issues

### 日志位置

- **macOS**: `~/Library/Logs/Rime/`
- **Linux**: `~/.local/share/fcitx5/rime/` 或 `~/.config/ibus/rime/`
- **Windows**: `%TEMP%\Rime\`

### 配置文件位置

- **macOS**: `~/Library/Rime/`
- **Linux (fcitx5)**: `~/.local/share/fcitx5/rime/`
- **Linux (ibus)**: `~/.config/ibus/rime/`
- **Windows**: `%APPDATA%\Rime\`

## 📚 参考资源

### 官方资源

- [Rime 官网](https://rime.im/)
- [Rime GitHub](https://github.com/rime)
- [配置指南](https://github.com/rime/librime-pguide)
- [词库仓库](https://github.com/rime/brise)

### 社区资源

- [Rime 主题](https://github.com/rime/rime-atom-dark)
- [方案分享](https://github.com/rime/rime-easy)
- [词库分享](https://github.com/rime/librime-pguide)

### 学习资料

- [Rime 入门教程](https://github.com/rime/home/wiki)
- [配置详解](https://github.com/LEOYoon-Tsai/Rime-with-Ibus)
- [方案开发指南](https://github.com/blankspace/rime-config-guide)

## 📄 许可证

MIT License - 详见项目根目录

## 🙏 致谢

感谢 Rime 项目和所有贡献者!

---

**最后更新**: 2026-01-10
**版本**: 1.0.0
**作者**: Rokun
