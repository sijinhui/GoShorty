DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""

## Ant Design 主题切换适配修复指南

本项目使用 CSS 变量（`index.css`）+ Ant Design ConfigProvider（`ThemeProvider.tsx`）双层体系实现暗色/亮色主题切换。修复页面主题适配时，按以下步骤排查和修复：

### 修复思路

#### 1. 页面组件层：消除硬编码样式

- **标题**：将自定义 `<h1>` / `<h2>` 等替换为 Ant Design 的 `<Typography.Title level={n}>`，让文字颜色自动跟随主题。
- **阴影**：将硬编码的 `boxShadow: '0 2px 8px rgba(...)'` 替换为 CSS 变量 `boxShadow: 'var(--shadow-sm)'`。
- **颜色**：所有内联 `color`、`backgroundColor` 应使用 CSS 变量（如 `var(--text-primary)`、`var(--bg-elevated)`），或直接使用 Ant Design 组件让主题 token 生效。

#### 2. ThemeProvider 层：配置组件级 token

在 `ThemeProvider.tsx` 的 `ConfigProvider` 中，需要为页面用到的每个 Ant Design 组件配置 `components` 级别的 token。常见需要配置的组件：

| 组件 | 关键 Token | 说明 |
|------|-----------|------|
| **Table** | `headerBg`, `headerSortActiveBg`, `headerSortHoverBg`, `fixedHeaderSortActiveBg`, `bodySortBg`, `rowHoverBg`, `borderColor`, `colorFillAlter`, `stickyScrollBarBg` | 表头、排序、悬停、滚动条等全部状态 |
| **Card** | `colorBgContainer`, `headerBg` | 卡片背景和标题栏 |
| **Descriptions** | `colorBgContainer`, `labelBg`, `colorSplit` | 描述列表的标签背景和分割线 |
| **Tag** | `defaultBg`, `defaultColor` | 默认标签的背景和文字 |
| **Statistic** | `titleColor`, `contentColor` | 统计组件的标题和数值颜色 |
| **Pagination** | `colorBgContainer`, `colorBgTextHover`, `colorBgTextActive` | 分页器背景和交互状态 |
| **Typography** | `colorTextDescription`, `colorLink`, `colorLinkHover` | 文字描述和链接颜色 |
| **Popconfirm** | `colorBgElevated` | 弹出确认框背景 |

全局 token 中需要注意的关键项：
- `colorFillTertiary`：控制 `<Text code>` 内联代码块的背景色
- `colorBgContainer`：容器类组件的默认背景
- `colorBorder` / `colorBorderSecondary`：边框颜色

#### 3. CSS 过渡动画层：确保切换平滑

在 `index.css` 中为所有受影响的 Ant Design CSS 类名
添加 `transition` 规则，确保主题切换时有平滑过渡而非突变。需要覆盖的选择器包括：

- 表格：`.ant-table`, `.ant-table-header`, `.ant-table-body`, `.ant-table-thead > tr > th`, `.ant-table-tbody > tr > td`, `.ant-table-placeholder`
- 分页：`.ant-pagination-item`, `.ant-pagination-item-active`, `.ant-pagination-options`
- 描述列表：`.ant-descriptions`, `.ant-descriptions-view`, `.ant-descriptions-row`, `.ant-descriptions-item-label`, `.ant-descriptions-item-content`
- 统计：`.ant-statistic-title`, `.ant-statistic-content`
- 通用：`.ant-card`, `.ant-tag`, `.ant-typography`, `code`, `kbd`

### 排查清单（新页面适配时逐项检查）

1. [ ] 页面中是否有硬编码的 `color` / `backgroundColor` / `boxShadow` 内联样式？→ 替换为 CSS 变量或 Ant Design 组件
2. [ ] 页面用到了哪些 Ant Design 组件？→ 确认 `ThemeProvider.tsx` 的 `components` 中已配置对应 token
3. [ ] 是否有使用 `scroll` 属性的 Table？→ 需要配置 `fixedHeaderSortActiveBg`、`stickyScrollBarBg` 等固定表头相关 token
4. [ ] 是否有 `<Text code>` 或内联 `<code>`？→ 确认全局 token 中 `colorFillTertiary` 已配置
5. [ ] `index.css` 中是否已为新组件的 CSS 类名添加过渡动画规则？