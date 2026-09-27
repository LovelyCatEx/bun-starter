---
name: background-image
description: 处理"背景图模式"下组件样式的 Skill。当需要让组件在背景图开启时透出/半透明、或新增背景图相关的变体与 token 时使用。涉及 light / dark（含深黑、深灰、浅灰四档颜色模式）的适配。
---

# 背景图模式（background-image）样式处理

本项目有一个调试页开关："背景图"。开启后 `<main>` 上会挂一张手绘背景图，
组件自动"透过去"（半透明）。本 Skill 说明这个机制怎么用、light/dark 怎么处理、以及踩过的坑。

**职责划分（改了会踩坑的核心）**：

- **背景图开关（`bgimage:`）= 半透明**。有背景图 → 组件把实心底降成半透明，让图透出来。
- **Frosted 开关（`frosted:`）= 只加模糊**，绝不改颜色。模糊叠在半透明底之上才是毛玻璃。

所以"实心组件在半透明/毛玻璃时透过去"这句话，永远写成 `bgimage:bg-card/60`，
**不是** `frosted:bg-card/60`。两个开关互相独立：背景图关掉时组件立刻回到实心
（此时 Frosted 开了也没有视觉效果，因为模糊被实心底挡死了 —— 这是预期行为）。

## 机制

### 1) 状态挂在 `<html>` 上
统一入口是 `web/src/hooks/use-theme-settings.ts` 的 **`useThemeSettings()`**
（它同时管日夜 / 暗色程度 / 主题色 / 背景图 / 高斯模糊 / 背景遮罩；
状态本体在 `web/src/hooks/theme-settings-provider.tsx`，所以到处调都是同一份），内部把开关写到属性上：

```ts
root.dataset.background = String(background) // -> data-background="true|false"
```

页面里直接用：

```tsx
const { background, setBackground } = useThemeSettings()
```

**不要在页面里手写 `dataset.background`**，一律走这个 hook。

### 2) 背景图本身
不是 `<img>`，是 `<main>` 上的 inline `backgroundImage`，由两层组成：

- 会平铺的 SVG 纹理（网格 + 圆点 + 十字 + 星），用 `encodeURIComponent` 生成 data URI
- 若干 `radial-gradient` / `linear-gradient` 色块

**关键点：所有色标都用带 alpha 的颜色**（`rgba(...)`），并且叠在 `bg-background` 之上。
这样一张图在 light / dark 下都自适应，不需要写两套背景。

### 3) CSS 变体 `bgimage:`
`web/src/styles/base.css`：

```css
@custom-variant bgimage (html[data-background='true'] &);
```

用法（组件里手写，只影响开背景图时）：

```tsx
className="... bgimage:bg-card/60"
```

**凡是"实心组件要不要透出去"的问题，答案都在这条 `bgimage:` 上**（`frosted:` 只负责模糊）。

### 4) 背景遮罩（可选的一层压暗/压亮）
背景图之上、所有内容之下，可以再压一层遮罩：**亮色压白、暗色压黑**，透明度由用户调。
它**不强制生效**：`overlay` 开关（`useThemeSettings()`）+ 一个透明度滑块，页面自己决定渲不渲染那一层。

```tsx
const { background, overlay } = useThemeSettings()

<main
  className="relative isolate min-h-svh bg-background"   // isolate 是关键，见下
  style={background ? { backgroundImage: BACKGROUND } : undefined}
>
  {background && overlay ? (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 bg-white opacity-(--background-overlay-opacity) dark:bg-black"
    />
  ) : null}
  …
</main>
```

- 透明度**不写 data 属性**，写的是 CSS 变量 `--background-overlay-opacity`（`<html>` 上，0~1，
  而且是**实际生效值**：遮罩开关关掉时它就是 0），遮罩层用 `opacity-(--background-overlay-opacity)` 读它
  —— 滑块一动，样式不用重算；背景图模式下的边框 token 也读同一个变量（见规则 D）
- `isolate`（`isolation: isolate`）**不能省**：`<main>` 不是 stacking context 时，
  `-z-10` 的遮罩会跑到根 stacking context 的负层里，被 `<main>` 自己的背景图**盖住**（表现为"完全没效果"）。
  一旦 `main` 是 stacking context，绘制顺序就是：main 背景图 → 负层遮罩 → 内容
- 遮罩只压背景（`bgimage:` 半透明的组件会连遮罩一起透出来），所以它同时是"让背景图别太抢"和
  "把半透明组件的观感压稳"的手段；它是**开着背景图才有意义**的那一层，两个开关都开才渲染

## light / dark 处理规则

### 规则 A：让"实心"组件半透明时，挑两模式都不透明的 token
推荐 `--card`、`--muted`、`--secondary` —— 它们在 light（如 `oklch(1 0 0)`）和 dark（如 `oklch(0.205 0 0)`）
都是**不透明纯色**，加 `/60` 只是等比降透明度，颜色不变：

```tsx
bgimage:bg-card/60     // ✅ light/dark 都只是变半透明
bgimage:bg-muted/60    // ✅
```

### 规则 B：绝对不要用 `--background` 去覆盖"暗色下本来是浅灰半透明"的控件
`--background` 在 dark 下是**近黑**。如果组件原本是 `dark:bg-input/30`（浅灰半透明），
你给它加 `bgimage:bg-background/60`，dark 下就变成"黑色半透明"，观感完全坏掉。

需要分模式正确时，显式补一条 dark：

```tsx
bgimage:bg-background/60 dark:bgimage:bg-input/30
```

### 规则 C：给"挖空/挡线"用的底色换成结构，而不是留一个不透明块
反面例子：`FieldSeparator` 的 `Or` 原本是 `bg-background` 的不透明小方块（用来把分隔线挖空），
开背景图后就是一块白/黑色块。正确做法是把结构改成"左右两段线 + 中间纯文字"，不再需要底色：

```tsx
<div className="flex h-full items-center gap-2">
  <Separator className="flex-1" />
  <span className="w-fit shrink-0 text-muted-foreground">{children}</span>
  <Separator className="flex-1" />
</div>
```

### 规则 D：整组边框 token 在背景图模式下压深一档，并随遮罩变深
花纹底色会把原来那圈浅灰 / 半透明的细边框糊掉，所以**覆盖 token**（不是一个个组件加 class），
而且**再往下压多少由遮罩厚度决定** —— `--background-overlay-opacity` 越大，边框越深：

```css
html[data-background='true']                       /* 亮色：压 lightness，0.78 → 0.73 */
{ --border: oklch(calc(0.78 - var(--background-overlay-opacity) * 0.05) 0 0); … }

html.dark[data-background='true']                  /* 深黑：抬不透明度，24% → 29% */
{ --border: oklch(1 0 0 / calc(0.24 + var(--background-overlay-opacity) * 0.05)); … }
/* 深灰 28%→33%、浅灰 34%→39%，同一个 block 里往下排 */
```

**区间是刻意压窄的**（5 个点）：起点已经比常态深不少（遮罩为 0 时图案最抢眼，边框得压得住），
终点只比起点再深一点（遮罩铺满时底色已经是纯白 / 纯黑，不需要更重）。别把它拉成 15 个点那种大行程，
实测两端都会不对（起点太浅、终点太灰）。

- **暗色里"更深"= 更实**：暗底上的边框是半透明白（`oklch(1 0 0 / 10%)`），再压 lightness 只会更看不见，
  所以要抬不透明度。四档的值一起写在 `base.css`（不拆去 `dark.css`），改的时候一眼看全
- 变量是**遮罩实际生效的透明度**（开关关掉时它是 0，见 provider），所以"没开遮罩"就等于"只压一档"，
  不会因为滑块上的残留数字而莫名变深；反过来滑块一动，边框立刻跟着变
- 覆盖 `--border` / `--input` / `--sidebar-border` 就够：`border`（base 层的 `border-color: var(--border)`）、
  `border-border`、`border-input`、`bg-border`、`border-input/30` 这类带 alpha 的写法全都跟着走
- 选择器特异性必须压过 `dark.css`：`.dark` 是 0,1,0、`.dark[data-dark-shade='x']` 是 0,2,0，
  所以写 `html.dark[data-dark-shade='x'][data-background='true']`（0,3,1）
- ⚠️ **面板那圈 `ring-1 ring-foreground/10`（Card / Popover / Dialog…）不跟这个 token 走**，
  它在背景图模式下不会变深。要一起变就得把那些组件改成 `ring-border`，或者补 `bgimage:ring-foreground/20`

### 规则 E：硬编码的底色（`bg-white` / `bg-black` / `bg-[#…]`）
背景图模式下"漏掉一块"最常见的来源不是忘了写 `bgimage:`，而是**底色是硬编码的**：
`bg-white` 这种既不跟主题走、也不吃 `bgimage:`，于是满页半透明里它就成了一块硬白块。

**先问一句：这个颜色是"语义"还是"面子"？**

| 情况 | 做法 |
| --- | --- |
| **面子**（一块白底只是因为"看起来白"） | **换 token**。`bg-white` 十有八九就是 `bg-background` / `bg-card` / `bg-popover`；换完它自动跟着四档暗色 + 主题色走，再按规则 A/B 补 `bgimage:bg-xx/60` |
| **语义**（scrim 就是黑、遮罩就是白/黑） | 保留硬编码，但**别让它参与 `bgimage:` 那套**：要么在背景图那一层（遮罩的 `-z-10`），要么盖在所有内容之上（Dialog/Drawer 的 `bg-black/10` scrim）。别让它待在面板里 |
| 不带 alpha 的 token 写法也漏 | token 对了也要看有没有 `bgimage:`：Slider 的 track/range 是 `bg-muted` / `bg-primary`，漏了 `bgimage:` 一样是一块实心 |

踩过的坑：`slider.tsx` 的 thumb 是 `bg-white`（上游 shadcn 是 `bg-background`），背景图一开，
满页只有这个小圆点还是纯白不透明。修法是 `bg-background bgimage:bg-background/60`
—— 亮色下 token 本来就是白（观感不变），暗色跟着 token 走，背景图模式下透出去。

## 已踩过的坑（务必遵守）

1. **不要给子元素普遍加半透明**。一个面板透明了，里面的组件再透明会互相叠加。
2. **半透明只认 `bgimage:`，`frosted:` 一个字都不许改颜色**。别把半透明写成 `frosted:bg-xx/60`
   —— 那等于"开了模糊才半透明"，跟背景图开关脱钩，关了背景图就再也透不出来。
   两个开关要同时见效时，各写各的（一条管颜色、一条管模糊）：
   ```tsx
   bgimage:bg-card/60 frosted:backdrop-blur-md
   ```
3. **默认不透明 + 只加 `data-background` 属性是感知不到背景图的**，必须通过变体显式改样式。
4. **交互态（hover / selected）会把半透明又顶回不透明**：需要时补 `bgimage:hover:bg-muted/50` 之类的变体，
   或按 `.claude/skills/frosted-glass/SKILL.md` 铁律 4 用 `!` 锁住。
5. **弹层的"小尖角"要单独跟着处理**。`Tooltip.Arrow` 就是一块 `rotate-45` 的方块（`bg-foreground fill-foreground`），
   气泡变半透明后它就是个"明显的小实心方块"。跟着变半透明还不够 —— 它**有一半压在气泡里**，
   整块画会叠加成 ~94% 的深色菱形，所以要把 `TooltipContent` 里那段 class 里的三条一起写上：

   ```tsx
   bgimage:bg-foreground/75     // 跟气泡同色
   bgimage:fill-transparent     // 丢掉 SVG path，否则方块被画两次
   bgimage:[clip-path:polygon(100%_100%,100%_50%,50%_100%)]  // 只留露在外面的那一半
   ```

   `clip-path` 是写在元素**旋转前**的坐标系里的，所以"留右下半"（`100% 100%` 那个角）经 `rotate-45`
   之后正好是"朝外的那一半"，四个方向（上下左右）都对。

## 新增组件时的检查清单

- [ ] 组件原本底色是什么？在 dark 下是否已经是半透明？（`dark:bg-input/30` 之类）
- [ ] 底色是**硬编码**的吗？（`bg-white` / `bg-black` / `bg-[#…]` → 按规则 E 换 token，别指望 `bgimage:` 能盖住它）
- [ ] 需要透明/半透明时，用的是不是两模式都不透明的 token（`--card`/`--muted`）？
- [ ] 是用 `bgimage:` 变体，而不是无条件改掉 `bg-card` / `bg-background`？
- [ ] 半透明有没有误写成 `frosted:bg-*`？（应该是 `bgimage:bg-*`）
- [ ] 这里面有没有靠 `--border` / `--input` / `--sidebar-border` 画的边？（有就自动跟着规则 D 变深，不用管）
- [ ] 内部有没有别的不透明底色挡着？（必要时一起处理）
- [ ] 触发了 hover/selected 等交互态会不会把半透明又变回不透明？
- [ ] 改完 `bun run --filter web build`，在 `dist/assets/*.css` 里确认 `html[data-background=true] .bgimage\:xxx` 规则真的存在。
