---
name: frosted-surface
description: 让一个组件适配「背景图」与「高斯模糊」两个模式的 Skill。当要给组件加毛玻璃、让它随背景图变半透明、排查"开了背景图还是实心的""开了模糊没效果""模糊被自己挡掉了"时使用。也覆盖新增 `data-slot` 标记、挑 token、判断该进哪个组。
---

# 毛玻璃表面（背景图 × 高斯模糊）

机制只有两处：组件上一个 `data-slot` 属性，以及 `web/src/styles/frosted.css` 里的一条规则。
样式不写进组件。

## 两个模式是叠加的

| | 触发条件 | 效果 |
| --- | --- | --- |
| **透**（降底色） | `data-background` 或 `data-frosted`，任一为真 | 表面半透明 |
| **糊**（`backdrop-filter`） | 仅 `data-frosted` | 在"透"的基础上模糊 |

即「开模糊」= 「开背景图」+ 模糊。四种组合：

| 背景图 | 模糊 | 结果 |
| --- | --- | --- |
| 关 | 关 | 实心 |
| 开 | 关 | 透，不糊 |
| 关 | 开 | 透 + 糊（背后是纯色，无可糊之物） |
| 开 | 开 | 毛玻璃 |

只开模糊时也必须透，否则不透明表面上没有可供模糊显影的层，外观与未开启无异。

选择器相应分两种：

```css
/* 降底色：两个开关都算 */
:is(html[data-frosted='true'], html[data-background='true']) [data-slot='foo'] { … }

/* 模糊：只认 data-frosted */
html[data-frosted='true'] [data-slot='foo'] { backdrop-filter: blur(var(--frosted-blur, 12px)); }
```

## SOP

### 1. 判断该元素是否自带底色

判据是 `className` 里有没有 `bg-*`，包括组件自己的和调用方传入的。

| 情况 | 处理 |
| --- | --- |
| 有底色（`bg-card` / `bg-muted` / `bg-background` / `bg-primary`…） | 降它用的那个 token，加进对应的组（第 3 步） |
| 无底色（只有边框 / 圈 / 格子） | 补一层（第 4 步）或只加模糊，取决于背后有没有东西给它显影 |
| 应当全透明（代码块、演示框垫层） | 走 `frosted.css` 里「代码 / 输出一律全透明」那条 |
| 无底色且是描边型卡片 | 不处理：它本来就透 |

调用方传入的 `className` 同样计入。既有实现里 `approval-card` 给 `Input` 传 `bg-background/70`、
`ToolApprovalCode` 给 `AgentCode` 传 `bg-muted/30`，因此补底色必须写成兜底档（低权重），
让元素上任何 `bg-*` 都能盖过它。

### 2. 打标记

加一个属性，`// frosted blur hook` 注释用于检索：

```tsx
<div
  // frosted blur hook
  data-slot="foo"
  className="rounded-2xl border bg-card p-4"
/>
```

- 打在**画底色的那个元素**上。底色在子元素上就打子元素；多个兄弟元素各自画同样的底色时，
  打在共同父元素上并用后代选择器选中
- 值用小写 kebab-case，带组件名前缀：`swap-token-picker` 而非 `picker`
- 底色在 `motion.li` 内部按钮上时，标记打 `li`：`ITEM` 一类变体会给 `li` 写 `filter: blur(0px)`，
  使其成为 backdrop root，内部按钮自己挂模糊只能采样 `li` 内部。打在 `li` 上则不受影响
  （元素自身的 `filter` 不挡自身的 `backdrop-filter`），且自定义属性会正常继承到按钮

### 3. 挑 token，加进对应的组

`frosted.css` 按 token 分组，新 slot 加到对应组的 `:is(...)` 列表里。

| 组 | 适用 | 淡到 |
| --- | --- | --- |
| `--background` | 面板 / 外框 / 未选中态勾选框 | 62% |
| `--card` | 卡片、菜单面板、弹层 | 62% |
| `--muted` | 选中 / 悬停高亮块、chip、轨道 | 62% |
| `--primary` | 主题色表面（按钮那条，或 `switch` / `table-menu-trigger`） | 88% |

不得覆盖 `--*-foreground`：那是文字色。`--foreground` 当底色用的位置（滑块填充、
`bg-foreground text-background` 的标签）也不能进组，它在那些位置同时是文字色。

档位判据：`/80` 及以上接近实心，进组；`/75` 及以下本就够透，只加模糊。

`backdrop-filter` 不依赖 `hover` 才生效，因此给仅悬停时才有底色的元素挂模糊，会让该区域
常态呈模糊状（`breadcrumb-link`、`wallet-account-trigger` 即如此）。不需要这种效果就不要挂。

### 4. 兜底：完全没有底色的元素

```css
@layer utilities {
    :where(:is(html[data-frosted='true'], html[data-background='true']))
        :where([data-slot='foo']) {
        background-color: var(--background);   /* 补哪一层与同节邻居对齐，不要一律 --background */
    }
}
```

### 5. 例外：需要"实心但照糊"

长列表下拉这类透出来会影响可读性的面板，加 `data-frosted-solid` 即可退出"透"这一半，
模糊保留。`frosted.css` 末尾只有这一组规则，不另写：

```tsx
<SelectContent solid>      {/* select.tsx 上的 prop 转发的即是该属性 */}
```

底色实心后 `backdrop-filter` 不再可见，保留它是为了与其它表面共用同一条规则。
若需要"实心但仍带一点玻璃"，把规则里的值改到 95%。

### 6. 验证

语法检查是 `bun run typecheck`（= `tsc -b`）。除它之外不跑任何测试，见根 `CLAUDE.md`。
确认规则进入了产物，查看 `dist/assets/index-*.css` 即可。

## 示例：自绘卡片

```tsx
// 有底色 → 进 --card 组
<div
  // frosted blur hook
  data-slot="panel-card"
  className="rounded-2xl border border-border bg-card p-4 text-card-foreground"
/>
```

```css
/* frosted.css —— 两半分开写 */

/* 降底色：加进 --card 那个 :is(...) 组 */
:is(html[data-frosted='true'], html[data-background='true'])
    :is(…, [data-slot='panel-card']) {
    --card: color-mix(in oklab, var(--card-solid) 62%, transparent);
}

/* 模糊：加进 blur 那条 :is(...) 列表 */
html[data-frosted='true'] :is(…, [data-slot='panel-card']) {
    backdrop-filter: blur(var(--frosted-blur, 12px));
}
```

无底色（仅一圈边框）的元素本身已经透，但没有东西给模糊显影：或按第 4 步补一层，
或保持原样，由背后的元素去糊。

## 常见失效原因

- 直接写 `background-color`（"补一层"与"压成全透明"两档、以及没有 token 的硬编码色除外）：
  本文件无层级，会连 `:hover` 一起压死。覆盖 token 才能让 hover / 暗色 / 主题色跟随
- 祖先带 `filter` / `mask` / `clip-path` / `opacity < 1` / `isolation: isolate` /
  `backdrop-filter` 时，后代的 `backdrop-filter` 只能采样该祖先内部，表现为"写法正确但无效果"。
  元素自身带这些属性不影响自身的模糊
- 整元素 `opacity < 1` 与 `backdrop-filter` 叠加会把已模糊的层与未模糊的页面混合，
  视觉上等同"没有模糊"。禁用态因此改用 token 压淡
- `createPortal` 弹层外侧常有带 `filter: drop-shadow(...)` 的定位壳，是 backdrop root。
  先置 `filter: none` 并把阴影改挂 `box-shadow`，面板自身的模糊才生效
- 上游自带的 `backdrop-blur-*` 半径固定、不受滑块控制，一律由本文件无层级的规则覆盖

## 边界

- 已标记的组与单独项见 `frontend.md`「毛玻璃」一节，不重复标记
  （`grep -o "data-slot='[a-z0-9-]*'" web/src/styles/frosted.css | sort -u | wc -l`）
- `bgimage:` 变体只用于没有 `data-slot` 的自绘元素
- 新增一组时，同步更新 `frontend.md` 的组表与「引入与维护」第 4 条的计数
