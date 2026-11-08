import { defineAsyncComponent, type Component } from 'vue'
import type { WidgetData, WidgetType } from '@/types/slides'

import TimerWidget from '@/views/components/element/WidgetElement/widgets/TimerWidget.vue'
import RollCallWidget from '@/views/components/element/WidgetElement/widgets/RollCallWidget.vue'

// 函数组件依赖 mathjs / echarts-gl，体积较大，按需加载
const FunctionWidget = defineAsyncComponent(() => {
  return import('@/views/components/element/WidgetElement/widgets/FunctionWidget.vue')
})

import timerPreview from '@/assets/widgets/timer.svg'
import rollCallPreview from '@/assets/widgets/rollcall.svg'
import functionPreview from '@/assets/widgets/function.svg'

export interface WidgetDefinition {
  type: WidgetType
  name: string
  description: string
  component: Component
  defaultData: () => WidgetData
  defaultSize: () => { width: number, height: number }
  preview: string
}

/**
 * 可视化组件注册表
 *
 * 扩展新的可视化组件只需要：
 * 1. 在 types/slides.ts 的 WidgetType / WidgetData 中补充类型
 * 2. 编写组件（props: data/width/height/color/fill/interactive）
 * 3. 在这里注册（名称、描述、默认数据、默认尺寸、预览图）
 * 4. 在 WidgetStylePanel 中补充属性编辑项
 */
export const WIDGET_LIST: WidgetDefinition[] = [
  {
    type: 'timer',
    name: '计时器',
    description: '倒计时或秒表，上限99分59秒',
    component: TimerWidget,
    defaultData: () => ({ mode: 'countdown', duration: 300 }),
    defaultSize: () => ({ width: 360, height: 180 }),
    preview: timerPreview,
  },
  {
    type: 'rollCall',
    name: '随机点名',
    description: '随机抽选一个座位，上限16排16列',
    component: RollCallWidget,
    defaultData: () => ({ rows: 2, cols: 4 }),
    defaultSize: () => ({ width: 420, height: 280 }),
    preview: rollCallPreview,
  },
  {
    type: 'function',
    name: '函数',
    description: '用表达式绘制函数曲线与三维曲面',
    component: FunctionWidget,
    defaultData: () => ({
      expressions: ['(x-a)^2'],
      varRanges: {
        x: { min: -10, max: 10 },
        y: { min: -10, max: 10 },
        z: { min: -10, max: 10 },
      },
    }),
    defaultSize: () => ({ width: 480, height: 360 }),
    preview: functionPreview,
  },
]

export const getWidgetDefinition = (type: WidgetType | string) => {
  return WIDGET_LIST.find(item => item.type === type)
}
