---
name: background-image
description: 处理"背景图模式"下组件样式的 Skill。当需要让组件在背景图开启时透出/半透明、或新增背景图相关的变体与 token 时使用。涉及 light / dark（含深黑、深灰、浅灰四档颜色模式）的适配。
---

# 背景图模式（background-image）样式处理

本项目有一个调试页开关："背景图"。开启后 `<main>` 上会挂一张手绘背景图，
组件需要按需"透过去"。本 Skill 说明这个机制怎么用、light/dark 怎么处理、以及踩过的坑。

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
frosted:bg-background/60 dark:frosted:bg-input/30
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
2. **背景图变体和 `frosted:` 变体互相独立**。两个都要时写两条（值一样也不会重复生效）：
   ```tsx
   frosted:bg-background/60 bgimage:bg-background/60
   ```
3. **默认不透明 + 只加 `data-background` 属性是感知不到背景图的**，必须通过变体显式改样式。

## 新增组件时的检查清单

- [ ] 组件原本底色是什么？在 dark 下是否已经是半透明？（`dark:bg-input/30` 之类）
- [ ] 需要透明/半透明时，用的是不是两模式都不透明的 token（`--card`/`--muted`）？
- [ ] 是用 `bgimage:` 变体，而不是无条件改掉 `bg-card` / `bg-background`？
- [ ] 内部有没有别的不透明底色挡着？（必要时一起处理）
- [ ] 触发了 hover/selected 等交互态会不会把半透明又变回不透明？
- [ ] 改完 `bun run --filter web build`，在 `dist/assets/*.css` 里确认 `html[data-background=true] .bgimage\:xxx` 规则真的存在。
