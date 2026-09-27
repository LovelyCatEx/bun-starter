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
（它同时管日夜 / 暗色程度 / 主题色 / 背景图 / 高斯模糊），内部把开关写到属性上：

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
- [ ] 需要透明/半透明时，用的是不是两模式都不透明的 token（`--card`/`--muted`）？
- [ ] 是用 `bgimage:` 变体，而不是无条件改掉 `bg-card` / `bg-background`？
- [ ] 半透明有没有误写成 `frosted:bg-*`？（应该是 `bgimage:bg-*`）
- [ ] 内部有没有别的不透明底色挡着？（必要时一起处理）
- [ ] 触发了 hover/selected 等交互态会不会把半透明又变回不透明？
- [ ] 改完 `bun run --filter web build`，在 `dist/assets/*.css` 里确认 `html[data-background=true] .bgimage\:xxx` 规则真的存在。
