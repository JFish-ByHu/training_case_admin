# Meteocons 天气图标

- 作者：Bas Milius
- 来源：https://github.com/basmilius/weather-icons
- 下载路径：`https://raw.githubusercontent.com/basmilius/weather-icons/dev/production/fill/svg/<图标名称>.svg`
- 获取日期：2026-11-11
- 许可：MIT，完整许可保留于本目录 `LICENSE`。

`animated/` 保留下载的原始填充版 SVG。`static/` 是本项目的静态衍生版本：
移除 SMIL 动画节点，将依赖透明度动画显现的雨滴、雪花等元素固定为可见状态。
静态版本用于预报列表及系统的“减少动态效果”模式。

仅收录当前天气代码映射需要的资源；新增映射时同时增加两种版本并更新
`src/components/weather/types.ts`。图标经 Vite 作为本地图片加载，不使用运行时 CDN 或内联 SVG 注入。
