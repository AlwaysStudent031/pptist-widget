<template>
  <div class="widget-style-panel">
    <template v-if="widgetType === 'timer'">
      <div class="row">
        <div style="width: 40%;">模式：</div>
        <Select
          style="flex: 1;"
          :value="timerData.mode"
          :options="timerModeOptions"
          @update:value="value => updateData({ mode: value as TimerWidgetData['mode'] })"
        />
      </div>
      <div v-if="timerData.mode === 'countdown'" class="row">
        <div style="width: 40%;">时长：</div>
        <div class="duration-group">
          <NumberInput :min="0" :max="99" :value="minute" @update:value="value => setDuration(value, second)" />
          <span> 分 </span>
          <NumberInput :min="0" :max="59" :value="second" @update:value="value => setDuration(minute, value)" />
          <span> 秒 </span>
        </div>
      </div>
    </template>

    <template v-else-if="widgetType === 'rollCall'">
      <div class="row">
        <div style="width: 40%;">排数：</div>
        <NumberInput
          style="width: 60%;"
          :min="1"
          :max="16"
          :value="rollCallData.rows"
          @update:value="value => updateRollCallSize({ rows: value })"
        />
      </div>
      <div class="row">
        <div style="width: 40%;">列数：</div>
        <NumberInput
          style="width: 60%;"
          :min="1"
          :max="16"
          :value="rollCallData.cols"
          @update:value="value => updateRollCallSize({ cols: value })"
        />
      </div>
    </template>

    <template v-else-if="widgetType === 'function'">
      <div class="expr-block">
        <div class="expr-label">表达式：</div>
        <Textarea
          :rows="5"
          placeholder="每行一条，如：sin(x) * cos(y)"
          :value="expressionsText"
          @update:value="value => setExpressions(value)"
          @blur="addHistorySnapshot()"
        />
        <div class="expr-tip">
          可用变量：x、y、z。含两个变量时绘制三维曲面，其余情况绘制二维曲线；其他字母会作为可调参数。
        </div>
      </div>
      <div v-for="name in varNames" :key="name" class="row">
        <div style="width: 40%;">{{ name.toUpperCase() }} 范围：</div>
        <div class="range-group">
          <NumberInput
            :min="-9999"
            :max="9999"
            :value="getVarRange(name).min"
            @update:value="value => updateVarRange(name, 'min', value)"
          />
          <span>~</span>
          <NumberInput
            :min="-9999"
            :max="9999"
            :value="getVarRange(name).max"
            @update:value="value => updateVarRange(name, 'max', value)"
          />
        </div>
      </div>
    </template>

    <Divider />

    <div class="row">
      <div style="width: 40%;">文字颜色：</div>
      <Popover trigger="click" style="width: 60%;">
        <template #content>
          <ColorPicker
            :modelValue="handleWidgetElement.color || '#333333'"
            @update:modelValue="value => updateWidget({ color: value })"
          />
        </template>
        <ColorButton :color="handleWidgetElement.color || '#333333'" />
      </Popover>
    </div>
    <div class="row">
      <div style="width: 40%;">背景颜色：</div>
      <Popover trigger="click" style="width: 60%;">
        <template #content>
          <ColorPicker
            :modelValue="handleWidgetElement.fill || '#ffffff'"
            @update:modelValue="value => updateWidget({ fill: value })"
          />
        </template>
        <ColorButton :color="handleWidgetElement.fill || '#ffffff'" />
      </Popover>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type {
  FunctionWidgetData,
  PPTElement,
  PPTWidgetElement,
  RollCallWidgetData,
  TimerWidgetData,
} from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'

import Select from '@/components/Select.vue'
import NumberInput from '@/components/NumberInput.vue'
import Textarea from '@/components/TextArea.vue'
import Divider from '@/components/Divider.vue'
import Popover from '@/components/Popover.vue'
import ColorButton from '@/components/ColorButton.vue'
import ColorPicker from '@/components/ColorPicker/index.vue'

const slidesStore = useSlidesStore()
const { handleElement } = storeToRefs(useMainStore())

const { addHistorySnapshot } = useHistorySnapshot()

const handleWidgetElement = handleElement as Ref<PPTWidgetElement>
const widgetType = computed(() => handleWidgetElement.value?.widgetType)
const varNames = ['x', 'y', 'z'] as const

const timerModeOptions = [
  { label: '倒计时', value: 'countdown' },
  { label: '秒表', value: 'stopwatch' },
]

const timerData = computed<TimerWidgetData>(() => {
  return (handleWidgetElement.value?.data || { mode: 'countdown', duration: 300 }) as TimerWidgetData
})

const rollCallData = computed<RollCallWidgetData>(() => {
  return (handleWidgetElement.value?.data || { rows: 2, cols: 4 }) as RollCallWidgetData
})

const functionData = computed<FunctionWidgetData>(() => {
  return (handleWidgetElement.value?.data || {
    expressions: [],
    varRanges: {
      x: { min: -10, max: 10 },
      y: { min: -10, max: 10 },
      z: { min: -10, max: 10 },
    },
  }) as FunctionWidgetData
})

const updateWidget = (props: Partial<PPTWidgetElement>) => {
  if (!handleElement.value) return
  slidesStore.updateElement({ id: handleElement.value.id, props })
  addHistorySnapshot()
}

const updateData = (patch: Record<string, unknown>, record = true) => {
  if (!handleWidgetElement.value) return

  const data = { ...(handleWidgetElement.value.data as unknown as Record<string, unknown>), ...patch }
  slidesStore.updateElement({ id: handleWidgetElement.value.id, props: { data } as unknown as Partial<PPTElement> })
  if (record) addHistorySnapshot()
}

const minute = computed(() => Math.floor((timerData.value.duration || 0) / 60))
const second = computed(() => (timerData.value.duration || 0) % 60)

const setDuration = (minuteValue: number, secondValue: number) => {
  const m = Math.min(99, Math.max(0, Math.round(minuteValue) || 0))
  const s = Math.min(59, Math.max(0, Math.round(secondValue) || 0))
  updateData({ duration: m * 60 + s })
}

const updateRollCallSize = (patch: Partial<RollCallWidgetData>) => {
  const data = { ...rollCallData.value, ...patch }
  data.rows = Math.min(16, Math.max(1, Math.round(data.rows) || 1))
  data.cols = Math.min(16, Math.max(1, Math.round(data.cols) || 1))
  updateData({ rows: data.rows, cols: data.cols })
}

const expressionsText = computed(() => {
  return (functionData.value.expressions || []).join('\n')
})

const setExpressions = (value: string) => {
  updateData({ expressions: value.split('\n') }, false)
}

const getVarRange = (name: 'x' | 'y' | 'z') => {
  return functionData.value.varRanges?.[name] || { min: -10, max: 10 }
}

const updateVarRange = (name: 'x' | 'y' | 'z', key: 'min' | 'max', value: number) => {
  const ranges = {
    x: { ...getVarRange('x') },
    y: { ...getVarRange('y') },
    z: { ...getVarRange('z') },
  }
  const normalize = (num: number) => {
    if (!Number.isFinite(num)) return 0
    return Math.max(-9999, Math.min(9999, num))
  }

  const range = { ...ranges[name], [key]: normalize(value) }

  if (range.min > range.max) [range.min, range.max] = [range.max, range.min]
  ranges[name] = range

  updateData({ varRanges: ranges })
}
</script>

<style lang="scss" scoped>
.row {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.duration-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;

  :deep(.number-input) {
    flex: 1;
  }
}
.range-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;

  :deep(.number-input) {
    flex: 1;
  }
}
.expr-block {
  width: 100%;
  margin-bottom: 10px;
}
.expr-label {
  margin-bottom: 6px;
}
.expr-tip {
  margin-top: 6px;
  font-size: 11px;
  line-height: 1.5;
  color: #999;
}
</style>
