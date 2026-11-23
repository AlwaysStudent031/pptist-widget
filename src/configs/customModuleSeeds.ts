import type { CustomModule } from '@/types/slides'

import cfgHtml from '@/assets/custom/cfg.html?raw'
import cfgCPreview from '@/assets/widgets/cfg-c.svg'
import cfgFPreview from '@/assets/widgets/cfg-f.svg'
import cfgGPreview from '@/assets/widgets/cfg-g.svg'

const CFG_BASE_STYLE = `<style>
html, body { margin: 0 !important; width: 1280px !important; height: 720px !important; overflow: hidden !important; }
body { transform-origin: top left !important; }
.tabs { display: none !important; }
.hero { display: none !important; }
.below { display: none !important; }
.footer { display: none !important; }
@media (max-width: 1050px) {
  .layout { grid-template-columns: minmax(0, 1fr) 300px !important; gap: 12px !important; }
  .shell { padding: 10px 14px 12px !important; }
  .cardtop { padding: 10px 12px !important; }
  .controls { padding: 10px 12px !important; }
  .field { margin-bottom: 10px !important; }
  .metric { margin: 10px 0 !important; }
  .tile { padding: 8px 10px !important; }
  .legend { padding: 8px 12px !important; }
  .explain { display: none !important; }
  .footer { display: none !important; }
}
</style>`

const CFG_FIT_SCRIPT = `<script>
(function () {
  const fit = () => {
    const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720)
    if (scale > 0) document.body.style.transform = 'scale(' + scale + ')'
  }
  window.addEventListener('resize', fit)
  fit()
})();
</script>`

const createCfgModule = (
  tab: 'c' | 'f' | 'g',
  name: string,
  description: string,
  preview: string,
): CustomModule => {
  const document = cfgHtml
    .replace('</head>', `${CFG_BASE_STYLE}</head>`)
    .replace(
      '</body>',
      `${CFG_FIT_SCRIPT}<script>setTimeout(() => document.querySelector('[data-tab="${tab}"]')?.click(), 0)</script></body>`,
    )

  return {
    id: `cfg-${tab}`,
    name,
    description,
    document,
    preview,
    builtin: true,
  }
}

/**
 * 自定义模块的内置示例：CFG 的三个可视化页面。
 * 每个模块都是一份完整的 HTML 文档，运行时放在 iframe 沙箱中。
 */
export const CUSTOM_MODULE_SEEDS: CustomModule[] = [
  createCfgModule('c', 'CFG · 联合密码', '平面反射 · 最短距离', cfgCPreview),
  createCfgModule('f', 'CFG · 太阳能板', '树形 DP · 最大权匹配', cfgFPreview),
  createCfgModule('g', 'CFG · 三维路径', '球面绕行 · 三维几何', cfgGPreview),
]
