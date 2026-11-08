<template>
  <div class="widget-function" :class="{ static: !interactive }" :style="{ backgroundColor: fill }" ref="rootRef">
    <div class="fs-charts">
      <div
        v-if="mode === '3d' && availableSeries.length"
        class="fs-legend3d"
        @mousedown.stop
        @touchstart.stop
        @click.stop="emit('interact', $event)"
      >
        <button
          v-for="item in availableSeries"
          :key="item.name"
          type="button"
          class="fs-legend-item"
          :class="{ off: hiddenSeries[item.name] === false }"
          :aria-pressed="hiddenSeries[item.name] !== false"
          @click="toggleSeries(item.name)"
        >
          <span class="fs-lmarker" aria-hidden="true"></span>
          <span class="fs-ltext">{{ item.name }}</span>
        </button>
      </div>

      <div ref="el2d" class="fs-view" :style="{ visibility: mode === '2d' ? 'visible' : 'hidden' }"></div>
      <div ref="el3d" class="fs-view" :style="{ visibility: mode === '3d' ? 'visible' : 'hidden' }"></div>

      <div v-if="errorMessage" class="fs-error">{{ errorMessage }}</div>
    </div>

    <div
      v-if="params.length"
      class="fs-params"
      @mousedown.stop
      @touchstart.stop
      @keydown.stop
      @click.stop="emit('interact', $event)"
    >
      <div v-for="param in params" :key="param.name" class="fs-param">
        <span class="fs-pname">{{ param.name }}</span>
        <input
          class="fs-prange"
          type="range"
          :min="param.min"
          :max="param.max"
          step="0.01"
          v-model.number="paramValues[param.name]"
          :aria-label="`参数 ${param.name} 滑块`"
        />
        <span class="fs-pval">{{ formatValue(paramValues[param.name]) }}</span>
        <span class="fs-pin">∈ [</span>
        <input
          class="fs-pnum"
          type="number"
          step="any"
          v-model.number="paramRanges[param.name].min"
          :aria-label="`参数 ${param.name} 最小值`"
        />
        <span class="fs-psep">,</span>
        <input
          class="fs-pnum"
          type="number"
          step="any"
          v-model.number="paramRanges[param.name].max"
          :aria-label="`参数 ${param.name} 最大值`"
        />
        <span class="fs-pin">]</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { parse } from 'mathjs'
import * as echarts from 'echarts'
import 'echarts-gl'
import type { FunctionWidgetData, WidgetVarRange } from '@/types/slides'

interface ParsedExpression {
  expr: string
  ok: boolean
  empty: boolean
  vars: string[]
  symbols: string[]
  compiled: { evaluate: (scope: Record<string, number>) => unknown } | null
  error?: string
}

const props = withDefaults(defineProps<{
  data: FunctionWidgetData
  width: number
  height: number
  color?: string
  fill?: string
  interactive?: boolean
}>(), {
  color: '#333333',
  fill: 'transparent',
  interactive: false,
})

const emit = defineEmits<{
  (event: 'interact', payload: Event): void
}>()

const VAR_NAMES = ['x', 'y', 'z'] as const
const MATH_CONSTANTS = new Set([
  'pi', 'e', 'tau', 'phi', 'i', 'Infinity', 'NaN', 'true', 'false', 'null',
])
const VIRIDIS = ['#440154', '#46327e', '#365c8d', '#277f8e', '#1fa187', '#4ac16d', '#a0da39', '#fde725']
const SERIES_COLORS = ['#d14424', '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']
const AXIS_COLOR = '#64748b'
const LINE_COLOR = '#cbd5e1'

const rootRef = ref<HTMLElement>()
const el2d = ref<HTMLElement>()
const el3d = ref<HTMLElement>()

const parsed = ref<ParsedExpression[]>([])
const usedVars = ref<string[]>([])
const mode = ref<'2d' | '3d'>('2d')
const hiddenSeries = reactive<Record<string, boolean>>({})
const paramRanges = reactive<Record<string, WidgetVarRange>>({})
const paramValues = reactive<Record<string, number>>({})
const chartError = ref('')

let chart2d: echarts.ECharts | null = null
let chart3d: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null
let updateTimer: ReturnType<typeof setTimeout> | null = null

const validExpressions = computed(() => parsed.value.filter(item => item.ok && !item.empty))

const availableSeries = computed(() => validExpressions.value.map(item => ({ name: item.expr })))

const params = computed(() => {
  return Object.keys(paramValues).sort().map(name => ({
    name,
    min: paramRanges[name]?.min ?? -10,
    max: paramRanges[name]?.max ?? 10,
  }))
})

const expressionError = computed(() => {
  if (parsed.value.some(item => !item.ok)) return '表达式有误，请检查'

  const hasInput = (props.data?.expressions || []).some(item => String(item ?? '').trim())
  if (hasInput && !validExpressions.value.length) return '没有可绘制的表达式'

  return ''
})

const errorMessage = computed(() => chartError.value || expressionError.value)

const formatValue = (value: number) => {
  return Number.isFinite(value) ? Number(value).toFixed(2) : '0.00'
}

const getVarRange = (name: string): WidgetVarRange => {
  const fallback: WidgetVarRange = { min: -10, max: 10 }
  const range = props.data?.varRanges?.[name as 'x' | 'y' | 'z']
  if (!range) return fallback

  let { min, max } = range
  if (!Number.isFinite(min)) min = fallback.min
  if (!Number.isFinite(max)) max = fallback.max
  if (min > max) [min, max] = [max, min]
  if (min === max) max = min + 1
  return { min, max }
}

const getScope = () => {
  const scope: Record<string, number> = {}
  for (const name of Object.keys(paramValues)) scope[name] = paramValues[name]
  return scope
}

const parseExpressions = () => {
  const list: ParsedExpression[] = []
  const expressions = Array.isArray(props.data?.expressions) ? props.data.expressions : []

  for (const raw of expressions) {
    const expr = String(raw ?? '').trim()

    if (!expr) {
      list.push({ expr, ok: true, empty: true, vars: [], symbols: [], compiled: null })
      continue
    }

    try {
      const node = parse(expr)
      const symbols = new Set<string>()

      node.traverse((child: any, _path: string, parent: any) => {
        if (!child.isSymbolNode || !child.name) return
        // 函数名（sin、cos 等）不是可调参数
        if (parent?.isFunctionNode && parent.fn === child) return
        symbols.add(child.name)
      })

      const vars = VAR_NAMES.filter(name => symbols.has(name))
      const compiled = node.compile()

      list.push({
        expr,
        ok: true,
        empty: false,
        vars,
        symbols: [...symbols].filter(name => !MATH_CONSTANTS.has(name)),
        compiled,
      })
    }
    catch (error) {
      list.push({
        expr,
        ok: false,
        empty: false,
        vars: [],
        symbols: [],
        compiled: null,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return list
}

const syncParams = (symbols: Set<string>) => {
  for (const name of Object.keys(paramValues)) {
    if (!symbols.has(name)) {
      delete paramValues[name]
      delete paramRanges[name]
    }
  }

  for (const name of symbols) {
    if (!(name in paramRanges)) paramRanges[name] = { min: -10, max: 10 }
    if (!(name in paramValues)) paramValues[name] = 1
  }
}

const clampParamValue = (name: string) => {
  const range = paramRanges[name]
  if (!range) return

  let { min, max } = range
  if (!Number.isFinite(min)) min = -10
  if (!Number.isFinite(max)) max = 10
  if (min > max) [min, max] = [max, min]
  range.min = min
  range.max = max

  const value = Number(paramValues[name])
  if (!Number.isFinite(value)) paramValues[name] = (min + max) / 2
  else if (value < min) paramValues[name] = min
  else if (value > max) paramValues[name] = max
}

const getAxisStyle = (name: string) => ({
  type: 'value',
  name,
  nameTextStyle: { color: AXIS_COLOR },
  axisLine: { lineStyle: { color: AXIS_COLOR } },
  axisTick: { lineStyle: { color: AXIS_COLOR } },
  axisLabel: { color: AXIS_COLOR, fontSize: 11 },
  splitLine: { lineStyle: { color: LINE_COLOR, opacity: .5 } },
})

const ensure2dChart = () => {
  if (!chart2d && el2d.value) {
    chart2d = echarts.init(el2d.value, undefined, { renderer: 'canvas' })
  }
  return chart2d
}

const ensure3dChart = () => {
  if (!chart3d && el3d.value) {
    chart3d = echarts.init(el3d.value, undefined, { renderer: 'canvas' })
  }
  return chart3d
}

const sample2d = (series: ParsedExpression[]) => {
  const axisVar = usedVars.value[0] || 'x'
  const range = getVarRange(axisVar)
  const sampleCount = Math.min(800, Math.max(160, Math.round(props.width * 1.6)))
  const yValues: number[] = []

  const seriesData = series.map((item, index) => {
    const color = SERIES_COLORS[index % SERIES_COLORS.length]
    const data: [number, number | null][] = []
    const scope = getScope()

    for (let i = 0; i < sampleCount; i++) {
      const value = range.min + (range.max - range.min) * i / (sampleCount - 1)
      let result: number | null = null

      try {
        scope[axisVar] = value
        const output = Number(item.compiled?.evaluate(scope))
        if (Number.isFinite(output)) {
          result = output
          yValues.push(output)
        }
      }
      catch {
        result = null
      }

      data.push([Number(value.toFixed(3)), result === null ? null : Number(result.toFixed(4))])
    }

    return {
      name: item.expr,
      type: 'line',
      showSymbol: false,
      connectNulls: false,
      lineStyle: { width: 2, color },
      itemStyle: { color },
      color,
      data,
    }
  })

  let yMin = -1
  let yMax = 1

  if (yValues.length) {
    yMin = Math.min(...yValues)
    yMax = Math.max(...yValues)
    if (yMin === yMax) {
      yMin -= 1
      yMax += 1
    }
    const padding = (yMax - yMin) * 0.15 || 1
    yMin -= padding
    yMax += padding
  }

  return {
    axisVar,
    axisRange: range,
    seriesData,
    yMin: Number(yMin.toFixed(3)),
    yMax: Number(yMax.toFixed(3)),
  }
}

const render2d = () => {
  const chart = ensure2dChart()
  if (!chart) return

  const series = validExpressions.value
  if (!series.length) {
    chart.clear()
    return
  }

  const { axisVar, axisRange, seriesData, yMin, yMax } = sample2d(series)

  const option = {
    animation: false,
    tooltip: { trigger: 'axis', confine: true },
    legend: {
      show: true,
      type: 'scroll',
      top: 8,
      left: 8,
      textStyle: { color: AXIS_COLOR, fontSize: 11 },
    },
    grid: { left: 6, right: 12, top: 36, bottom: 0, containLabel: true },
    xAxis: {
      type: 'value',
      min: axisRange.min,
      max: axisRange.max,
      name: axisVar,
      nameTextStyle: { color: AXIS_COLOR },
      axisLine: { lineStyle: { color: AXIS_COLOR } },
      axisLabel: { color: AXIS_COLOR, fontSize: 11 },
      splitLine: { lineStyle: { color: LINE_COLOR, opacity: .35 } },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      name: axisVar === 'x' ? 'y' : 'f',
      nameTextStyle: { color: AXIS_COLOR },
      axisLine: { lineStyle: { color: AXIS_COLOR } },
      axisLabel: { color: AXIS_COLOR, fontSize: 11 },
      splitLine: { lineStyle: { color: LINE_COLOR, opacity: .35 } },
    },
    series: seriesData,
  }

  chart.setOption(option as echarts.EChartsOption, { replaceMerge: ['series'] })
  chart.resize()
}

const render3d = () => {
  const chart = ensure3dChart()
  if (!chart) return

  const series = validExpressions.value

  if (usedVars.value.length < 2 || !series.length) {
    chart.clear()
    return
  }

  const xVar = usedVars.value[0]
  const yVar = usedVars.value[1]
  const zVar = VAR_NAMES.find(name => name !== xVar && name !== yVar) || 'z'
  const xRange = getVarRange(xVar)
  const yRange = getVarRange(yVar)

  const resolution = Math.min(80, Math.max(20, Math.round(Math.min(props.width, props.height) / 5)))
  let zMin = Infinity
  let zMax = -Infinity

  const seriesData = series.map(item => {
    const scope = getScope()
    const data: [number, number, number][] = []

    for (let i = 0; i < resolution; i++) {
      const x = xRange.min + (xRange.max - xRange.min) * i / (resolution - 1)

      for (let j = 0; j < resolution; j++) {
        const y = yRange.min + (yRange.max - yRange.min) * j / (resolution - 1)
        scope[xVar] = x
        scope[yVar] = y

        let z = NaN
        try {
          const output = Number(item.compiled?.evaluate(scope))
          if (Number.isFinite(output)) {
            z = output
            if (z < zMin) zMin = z
            if (z > zMax) zMax = z
          }
        }
        catch {
          z = NaN
        }

        data.push([Number(x.toFixed(2)), Number(y.toFixed(2)), Number(z.toFixed(3))])
      }
    }

    return {
      name: item.expr,
      type: 'surface',
      shading: 'color',
      dataShape: [resolution, resolution],
      wireframe: {
        show: true,
        lineStyle: { color: 'rgba(255,255,255,0.22)', width: 1 },
      },
      data,
    }
  }).filter(item => hiddenSeries[item.name] !== false)

  if (!Number.isFinite(zMin) || !Number.isFinite(zMax)) {
    zMin = 0
    zMax = 1
  }
  if (zMin === zMax) zMax = zMin + 1

  const option = {
    animation: false,
    tooltip: {
      formatter: (params: { value?: [number, number, number] }) => {
        const value = params.value
        if (!value) return ''
        return `${xVar} = ${value[0].toFixed(2)}<br>${yVar} = ${value[1].toFixed(2)}<br>${zVar} = ${value[2].toFixed(3)}`
      },
    },
    visualMap: {
      show: false,
      dimension: 2,
      min: zMin,
      max: zMax,
      inRange: { color: VIRIDIS },
    },
    grid3D: {
      boxWidth: 100,
      boxDepth: 100,
      boxHeight: 55,
      environment: 'none',
      viewControl: {
        distance: 235,
        alpha: 28,
        beta: 40,
        autoRotateSpeed: 12,
        minDistance: 60,
        maxDistance: 600,
      },
      axisLine: { lineStyle: { color: LINE_COLOR } },
      splitLine: { lineStyle: { color: LINE_COLOR, opacity: .5 } },
    },
    xAxis3D: getAxisStyle(xVar),
    yAxis3D: getAxisStyle(yVar),
    zAxis3D: getAxisStyle(zVar),
    series: seriesData,
  }

  try {
    chart.setOption(option as unknown as echarts.EChartsOption, { replaceMerge: ['series'] })
    chart.resize()
    chartError.value = ''
  }
  catch (error) {
    chartError.value = '三维图像渲染失败，请检查表达式'
    console.error(error)
  }
}

const render = () => {
  if (!rootRef.value) return

  if (mode.value === '2d') render2d()
  else render3d()
}

const rebuild = () => {
  const list = parseExpressions()
  parsed.value = list

  const valid = list.filter(item => item.ok && !item.empty)
  usedVars.value = VAR_NAMES.filter(name => valid.some(item => item.vars.includes(name)))
  mode.value = usedVars.value.length === 2 ? '3d' : '2d'

  const symbols = new Set<string>()
  for (const item of list) {
    if (!item.ok) continue
    for (const name of item.symbols) {
      if (!VAR_NAMES.includes(name as 'x' | 'y' | 'z')) symbols.add(name)
    }
  }

  syncParams(symbols)

  for (const name of Object.keys(paramRanges)) {
    if (name in paramValues) clampParamValue(name)
  }

  nextTick(() => {
    render()
    setTimeout(() => {
      chart2d?.resize()
      chart3d?.resize()
    }, 0)
  })
}

const scheduleRebuild = (delay = 150) => {
  if (updateTimer) clearTimeout(updateTimer)
  updateTimer = setTimeout(() => {
    updateTimer = null
    rebuild()
  }, delay)
}

const toggleSeries = (name: string) => {
  hiddenSeries[name] = hiddenSeries[name] === false
  if (mode.value === '3d') render3d()
}

watch(() => props.data?.expressions, () => scheduleRebuild(250), { deep: true })
watch(() => props.data?.varRanges, () => scheduleRebuild(150), { deep: true })
watch(paramValues, () => scheduleRebuild(80), { deep: true })
watch(paramRanges, () => {
  for (const name of Object.keys(paramRanges)) {
    if (name in paramValues) clampParamValue(name)
  }
  scheduleRebuild(150)
}, { deep: true })

onMounted(() => {
  rebuild()

  if (rootRef.value) {
    resizeObserver = new ResizeObserver(() => {
      chart2d?.resize()
      chart3d?.resize()
    })
    resizeObserver.observe(rootRef.value)
  }
})

onBeforeUnmount(() => {
  if (updateTimer) clearTimeout(updateTimer)
  resizeObserver?.disconnect()
  chart2d?.dispose()
  chart3d?.dispose()
  chart2d = null
  chart3d = null
})
</script>

<style lang="scss" scoped>
.widget-function {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.static .fs-params {
    pointer-events: none;
  }
}
.fs-charts {
  flex: 1;
  min-height: 0;
  position: relative;
  width: 100%;
}
.fs-view {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.fs-legend3d {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 14px;
  max-width: 70%;
}
.fs-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border: 0;
  background: transparent;
  cursor: pointer;
  min-width: 0;

  &.off {
    opacity: .45;

    .fs-lmarker {
      filter: grayscale(1);
    }
    .fs-ltext {
      color: #94a3b8;
    }
  }
}
.fs-lmarker {
  flex: none;
  width: 28px;
  height: 12px;
  border-radius: 3px;
  background: linear-gradient(90deg, #440154, #31688e, #1fa187, #a0da39, #fde725);
}
.fs-ltext {
  font-size: 11px;
  color: #64748b;
  font-family: ui-monospace, Consolas, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.fs-params {
  position: relative;
  z-index: 10;
  flex: none;
  padding: 6px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fs-param {
  display: flex;
  align-items: center;
  gap: 10px;
}
.fs-pname {
  flex: none;
  min-width: 18px;
  font-family: ui-monospace, Consolas, 'Courier New', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}
.fs-prange {
  flex: 1;
  min-width: 0;
  accent-color: $themeColor;
  cursor: pointer;
}
.fs-pval {
  flex: none;
  width: 52px;
  text-align: right;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  color: #475569;
}
.fs-pnum {
  flex: none;
  width: 62px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 3px 6px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  color: #0f172a;
  background: #fff;

  &:focus {
    outline: 2px solid #4c6ef5;
    outline-offset: -1px;
  }
}
.fs-psep,
.fs-pin {
  flex: none;
  color: #94a3b8;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
}
.fs-error {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 8px 12px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, .9);
  color: #d14424;
  font-size: 12px;
  white-space: nowrap;
}
</style>
