---
name: frosted-glass
description: 处理"高斯模糊 / 毛玻璃模式"组件样式的 Skill。当需要给某个 shadcn 组件加毛玻璃效果、排查"没模糊""模糊被挡""复合模糊""hover 变回不透明"等问题时使用。涉及 light / dark（含深黑、深灰、浅灰四档颜色模式）的适配。
---

# 高斯模糊 / 毛玻璃模式（frosted-glass）样式处理

调试页顶部有个 **Frosted** 开关。开启后组件按需变成"毛玻璃"。
**核心原则：只在组件容器上手动加一次 `backdrop-filter`，一个字都不改它原本的颜色。**

半透明**不是** `frosted:` 的职责，而是**"背景图"开关的职责**（`bgimage:` 变体，见
`.claude/skills/background-image/SKILL.md`）：**有背景图 → 组件自动半透明；Frosted → 在这层半透明上再叠一层模糊。**
所以两个开关是正交的：

| 背景图 | Frosted | 效果 |
| --- | --- | --- |
| 关 | 关 | 实心控件（默认样子） |
| 开 | 关 | 半透明，背景图透过组件 |
| 关 | 开 | **没有视觉变化**（实心底把模糊挡死了，这是正常的） |
| 开 | 开 | 毛玻璃 |

## 机制

### 1) 状态挂在 `<html>` 上
统一入口是 `web/src/hooks/use-theme-settings.ts` 的 **`useThemeSettings()`**
（它同时管日夜 / 暗色程度 / 主题色 / 背景图 / 高斯模糊），内部把开关写到属性上：

```ts
root.dataset.frosted = String(frosted) // -> data-frosted="true|false"
```

页面里直接用：

```tsx
const { frosted, setFrosted } = useThemeSettings()
```

**不要在页面里手写 `dataset.frosted`**，一律走这个 hook。

### 2) CSS 变体 `frosted:`
`web/src/styles/base.css`：

```css
@custom-variant frosted (html[data-frosted='true'] &);
```

组件里手写（只影响开关打开时）：

```tsx
className="... frosted:backdrop-blur-md"
```

## 加模糊的六条铁律

### 铁律 1：只加模糊，不改颜色
组件实心时 `backdrop-filter` 需要能"看见"背后的东西，而模糊能不能看见**取决于元素自己透不透**：

- 元素半透明（`bg-transparent` / `dark:bg-input/30`，或背景图模式下的 `bgimage:bg-xx/60`）→ `frosted:backdrop-blur-md` 立刻见效
- 元素实心（`bg-card` / `bg-background`）→ 模糊被自己的底色挡死，**看起来就是"没生效"**

**正确的处理不是给 `frosted:` 补一个半透明底，而是让它本来就在背景图模式下半透明**（见铁律 2）。

### 铁律 2：半透明底写 `bgimage:`，不写 `frosted:`
想让实心组件在半透明/毛玻璃时"透过去"，写的是 **`bgimage:`**（`html[data-background='true']`），
不是 `frosted:`：

```tsx
// ✅ Card / Alert / Popover 就是这么写的
bgimage:bg-card/60       // 开背景图 → 半透明
frosted:backdrop-blur-md // 开 Frosted → 在它上面叠模糊

// ❌ 不要用 frosted: 改颜色 —— 那会变成"开了模糊才半透明"，
//    而且关了背景图时模糊本来也看不见
frosted:bg-card/60
```

**挑 token 的规则不变：半透明底只用"两种模式都不透明"的 token** ——
`--card`、`--muted`、`--secondary` 在 light（`oklch(1 0 0)`）和 dark（`oklch(0.205 0 0)`）都是不透明纯色，
加 `/60` 只是等比降透明度，**颜色不会变**。

❌ **不要**用 `--background` 去替换一个"暗色下本来就是浅灰半透明"的控件。
`--background` 在 dark 下是近黑，会把 `dark:bg-input/30`（浅灰半透明）变成"黑色半透明"。
需要分模式正确时，显式补 dark：

```tsx
// 亮色半透明白、暗色保持原样
bgimage:bg-background/60 dark:bgimage:bg-input/30
```

（已实测：产物 CSS 里 `dark:bgimage:xxx` 排在 `bgimage:xxx` 之后，能正确覆盖。）

#### 底色不在 class 上怎么办（CSS 变量 / 第三方库）

有些组件的底色不在我们的 class 串里，而是走 CSS 变量或第三方自己的 stylesheet。
**原则不变**：半透明底挂 `bgimage:`、模糊挂 `frosted:`，只是"挂在哪"要选对。

以 **sonner 的 Toast** 为例（`web/src/components/ui/sonner.tsx`）：

- toast 底色来自我们通过 `style` 传的 inline 变量 `--normal-bg: var(--popover)`，由 **sonner 自己的 stylesheet** 消费：

  ```css
  [data-sonner-toast][data-styled=true]{ background: var(--normal-bg); ... }  /* 特异性 0,2,0 */
  ```

- ❌ **不要**把 `--normal-bg` 改成 `color-mix(...)`：inline style 是**无条件**的，
  它跟背景图开关毫无关系，只会让 toast 永远半透明。
- ✅ **在 toast 元素上挂 class**（sonner 支持 `toastOptions.classNames.toast`）：

  ```tsx
  toastOptions={{ classNames: { toast: "cn-toast bgimage:bg-popover/60! frosted:backdrop-blur-md!" } }}
  ```

  我们生成的是 `html[data-background=true] .bgimage\:bg-popover\/60`，特异性 **0,2,1** > sonner 的 0,2,0。

**更坑的一层：CSS 层叠层（cascade layers）。**
Tailwind 生成的工具类都在 **`@layer utilities`** 里；而**第三方库是运行时把 CSS 注入
`<style>`，没有层（unlayered）**。规范规定：**无层的普通声明优先于任何层内的普通声明，与特异性无关**。
所以即使我们的选择器特异性更高（0,2,1 > 0,2,0），也会被 sonner 的 `[data-sonner-toast][data-styled=true]` 压掉 ——
表现就是"class 明明挂上了，却完全没变"。

**遇到第三方 CSS 时，直接上 `!`**（`!important` 的优先级高于层叠层）：

```tsx
toast: "cn-toast bgimage:bg-popover/60! frosted:backdrop-blur-md!",
```

产物确认：`html[data-background=true] .bgimage\:bg-popover\/60\!{background-color:color-mix(...)!important}`

通用判断顺序：**先比"有没有层"，再比特异性，最后比顺序**：

1. 对方是运行时注入的第三方 CSS（无层）→ 直接 `!`
2. 双方都在层内 → 比特异性（我们的 `html[data-…=true] …` 通常已更高）
3. 打平 → 比产物 CSS 里的先后，必要时 `!`

### 铁律 3：一个组件只糊一次，且只糊容器
**不要**给每个子元素都加 `backdrop-filter`，否则同一个区域会叠出"复合 blur"（又糊又脏）。

- 只给**组件容器**加 `frosted:backdrop-blur-md`
- 子元素如果**自带** blur（典型是 `<Button>` 的 base 里有 `frosted:backdrop-blur-md`），要显式取消：

```tsx
frosted:backdrop-blur-none
```

已这么做的地方：`input-group.tsx`（group 根加 md，内部 `InputGroupInput`/`InputGroupTextarea` 加 none）、
`calendar.tsx`（root 加 md，日期格子 `CalendarDayButton` + 翻月按钮 `button_previous`/`button_next` 加 none）。

反例（曾经犯过）：`InputOTP` 里那个 `position:absolute; inset:0` 的覆盖 `<input data-slot="input-otp">`
被糊了一整块 → 必须排除；只糊 `input-otp` 容器。

### 铁律 4：交互态要保持，必要时用 `!`
hover / selected 这类状态很容易把毛玻璃又变回不透明，或者把选中色冲掉。
典型：日历选中日 hover。

```tsx
hover:data-[selected-single=true]:bg-primary!
hover:data-[selected-single=true]:text-primary-foreground!
```

**为什么必须带 `!`**：`dark:hover:bg-muted/50`、`dark:hover:text-foreground` 这类规则的特异性与
`hover:data-[…]:bg-primary` **打平**（都是 0,3,0），但它们在产物 CSS 里**排在后面**，会赢。
`!important` 不参与特异性比较，才能稳定压过。背景和文字色要一起锁，否则暗色下"黑底黑字"。

### 铁律 5：弹层不要把 `backdrop-filter` 加在"容器本体"上

CSS 规范：元素一旦有 `backdrop-filter`，就**成为其 `position: fixed` 后代的包含块**（和 `transform`/`filter` 一样）。
Radix 的 popper 内容（Content / SubContent）用的是 inline `position: fixed`。

踩过的坑：给 `ContextMenuContent` 直接加 `frosted:backdrop-blur-md` 后，
它的 **二级菜单（SubContent 是它的 DOM 后代）定位基准从视口变成父菜单**，再被父菜单的 `overflow-y-auto` 裁掉 →
表现为"二级菜单被遮住了"。

**正确写法：把模糊搬到伪元素上**，容器本体不带 filter：

```tsx
// ContextMenu / DropdownMenu / Menubar 的 content 与 sub-content
bgimage:bg-popover/60   // 半透明底照旧由背景图开关负责
frosted:before:pointer-events-none frosted:before:absolute frosted:before:inset-0
frosted:before:rounded-[inherit] frosted:before:-z-10 frosted:before:backdrop-blur-md
```

⚠️ **`frosted:before:rounded-[inherit]` 不能省**。伪元素默认是个**矩形**，
即使父元素有 `rounded-lg`，四个角上的模糊也不会被切掉 → 视觉上会露出**直角长方形**
（用户会看到"不该被遮住的地方被糊了"）。`border-radius: inherit` 让伪元素也圆角，模糊范围就和菜单形状一致了。

视觉结果和直接加在元素上**完全一样**（伪元素铺满、在内容下面模糊，元素的 60% 半透明底盖在上面），
但不影响 fixed 后代。

判断：**content 里可能有 SubContent / fixed 定位子元素 → 一律用 `before:` 写法**。

### 铁律 6：祖先的 `mask` / `filter` / `opacity` 会杀掉后代的模糊

CSS 规范里，元素只要有 **`mask`（含 `-webkit-mask`）、`filter`、`backdrop-filter`、`opacity < 1`、`isolation` 之一，
就形成一个 backdrop root**。后代的 `backdrop-filter` 只能采样这个 root **内部**的画面；
而这类容器通常自己没有底色 → 后代背后是空的 → **糊了等于没糊**。

踩过的坑：`AttachmentGroup` 默认带 `scroll-fade-x`，它就是一段 `mask-image`：

```css
.scroll-fade-x{ mask-image: var(--scroll-fade-mask, var(--scroll-fade-inline)); ... }
```

于是组里的每个 `Attachment` 怎么加 `frosted:backdrop-blur-md` 都毫无变化 —— 单独看组件永远查不出来。

**修法**：开启 frosted 时把这个 mask 中和掉（它本身只是滚动边缘淡出）：

```tsx
// AttachmentGroup
frosted:[--scroll-fade-mask:none]
```

产物确认：`html[data-frosted=true] .frosted\:\[--scroll-fade-mask\:none\]{--scroll-fade-mask:none}`

排查提示：**"组件自己写对了但完全没效果"时，先往上找祖先有没有 `mask` / `filter` / `opacity` / `backdrop-filter`。**

## light / dark 处理要点

| 场景 | 做法 |
| --- | --- |
| 控件本来就透明/半透明（`bg-transparent`、`dark:bg-input/30`） | 只加 `frosted:backdrop-blur-md`，light/dark 都自然可见 |
| 面板实心（`bg-card`） | `bgimage:bg-card/60` + `frosted:backdrop-blur-md` |
| 面板实心且底色是 `bg-background`（Calendar） | `bgimage:bg-background/60` + blur；隐藏坑：`--background` 在 dark 是深色，但**它原本就是这个颜色**，所以只是降透明度，安全 |
| 内部控件是 `<Button>` | 额外加 `frosted:backdrop-blur-none` 取消叠加 |
| 有 hover/selected | 用 `!` 锁住背景与文字色 |
| 底色来自 CSS 变量 / 第三方库（sonner toast） | 不改变量（inline 是无条件的），改为在该元素上挂 `bgimage:bg-xx/60!` + `frosted:backdrop-blur-md!`（第三方 CSS 无层，必须用 `!` 才能压过） |
| content 含 SubContent / fixed 定位后代（各种菜单） | 用 `before:` 伪元素写 blur（铁律 5） |
| 祖先带 `mask` / `filter` / `opacity`（如 `scroll-fade-*`） | 后代 blur 会失效，用 `frosted:[--xxx:none]` 中和掉那个属性（铁律 6） |
| 底色是硬编码的 `bg-white` / `bg-black` / `bg-[#…]` | 先换成 token（`bg-background` / `bg-card`…），否则它既不跟主题走、也不吃 `bgimage:`，毛玻璃更是无从谈起 → 见 `.claude/skills/background-image/SKILL.md` 规则 E |

## 排查步骤（"没生效"的时候）

1. `bun run --filter web build`，用脚本在 `dist/assets/*.css` 里搜：
   ```python
   re.findall(r"html\[data-frosted=true\][^{]*\{[^}]*\}", css)
   ```
2. 元素**真的在不在 `data-frosted=true` 下**？变体拼错、属性没写到 `<html>` 都会导致不生效。
3. 元素透不透？不透明就看不到模糊 —— 但**修法是给它补 `bgimage:` 半透明底（铁律 2），不是给 `frosted:` 写颜色**。
4. 是不是被**后写的同特异性规则**盖掉了？（回到铁律 4，用 `!`）
5. 是不是**叠加了多层 blur**？（回到铁律 3，把内部那层 `backdrop-blur-none` 掉）
6. **背景图开关没开**？（底色实心时模糊前后一模一样，看不到效果是正常的；先开背景图再看）
7. 是弹层吗？**按钮/子菜单/输入框位置错了、被裁掉** → 是铁律 5，改用 `before:` 伪元素写法
8. 底色不在 class 上？（CSS 变量 / 第三方库）→ 见铁律 2 的小节，改挂 class 而不是改变量
9. **class 明明挂上了却一点没变**？→ 大概率是被**无层的第三方 CSS**（运行时注入的 `<style>`）压过，
   因为 Tailwind 的工具类在 `@layer utilities` 里，无层样式优先于层内样式 → 直接上 `!`
10. 组件自身写对了、祖先有没有 `mask` / `filter` / `opacity`？→ 铁律 6，形成 backdrop root 会让后代 blur 彻底失效

## 新增组件时的检查清单

- [ ] 是给**容器**加 blur，而不是给每个 `data-slot` 子元素加？
- [ ] 组件实心吗？实心就给它一个 `bgimage:` 的半透明底（两模式都不透明的 token + `/60`），**而不是** `frosted:bg-xx/60`
- [ ] 有没有不小心写成 `frosted:bg-*`？（`frosted:` 只允许出现 `backdrop-blur-*` 与铁律 5/6 那几个结构工具类）
- [ ] 内部有没有 `<Button>` 之类自带 blur 的元素？加了 `frosted:backdrop-blur-none` 吗？
- [ ] hover / selected 状态会不会破坏效果？需要就用 `…!` 锁背景 + 文字色
- [ ] 有没有误用 `--background` 去覆盖暗色下本来是浅灰半透明的控件？
- [ ] 底色不在 class 上（CSS 变量/第三方库）吗？→ 挂 class 靠特异性压，别改 inline 变量
- [ ] 是弹层且内部有 SubContent / fixed 定位后代吗？→ 用 `before:` 伪元素写 blur
- [ ] 祖先有没有 `mask` / `filter` / `opacity`（如 `scroll-fade-*`）？→ 用 `frosted:[--xxx:none]` 中和
- [ ] 构建后确认产物 CSS 里有对应规则
