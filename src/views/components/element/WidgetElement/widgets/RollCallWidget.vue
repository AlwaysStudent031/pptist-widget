<template>
  <div class="widget-rollcall" :style="{ backgroundColor: fill }">
    <div class="result" :style="{ color, fontSize: resultFontSize + 'px' }">{{ resultText }}</div>
    <div class="matrix" :style="matrixStyle">
      <div
        v-for="(_, index) in seats"
        :key="index"
        class="seat"
        :class="{ lit: index === resultIndex }"
        :style="seatStyle"
      ></div>
    </div>
    <div class="controls" :class="{ static: !interactive }">
      <button
        type="button"
        class="control-btn"
        :style="{
          width: buttonSize + 'px',
          height: buttonSize + 'px',
          borderRadius: buttonSize / 2 + 'px',
        }"
        :title="drawing ? '终止' : '开始'"
        @mousedown.stop
        @touchstart.stop
        @click.stop="emit('interact', $event); toggle()"
      >
        <svg v-if="drawing" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
        <svg v-else viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import type { RollCallWidgetData } from '@/types/slides'

const props = withDefaults(defineProps<{
  data: RollCallWidgetData
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

const MAX_SIZE = 16

const rows = computed(() => Math.min(MAX_SIZE, Math.max(1, Number(props.data?.rows) | 0)))
const cols = computed(() => Math.min(MAX_SIZE, Math.max(1, Number(props.data?.cols) | 0)))
const seats = computed(() => new Array(rows.value * cols.value).fill(0))

const resultIndex = ref(-1)
const drawing = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const resultFontSize = computed(() => Math.max(11, props.height * 0.09))

const buttonSize = computed(() => {
  return Math.max(22, Math.min(props.height * 0.22, props.width * 0.3, 56))
})

const gapSize = computed(() => {
  return Math.max(2, Math.min(props.width, props.height) * 0.012)
})

const seatSize = computed(() => {
  const controlsHeight = buttonSize.value + 14
  const resultHeight = resultFontSize.value * 1.6 + 8
  const width = (props.width - 20 - gapSize.value * (cols.value - 1)) / cols.value
  const height = (props.height - resultHeight - controlsHeight - 12 - gapSize.value * (rows.value - 1)) / rows.value
  return Math.max(2, Math.min(width, height))
})

const matrixStyle = computed(() => ({
  gridTemplateColumns: `repeat(${cols.value}, ${seatSize.value}px)`,
  gap: gapSize.value + 'px',
}))

const seatStyle = computed(() => ({
  width: seatSize.value + 'px',
  height: seatSize.value + 'px',
}))

const resultText = computed(() => {
  if (resultIndex.value === -1) return '准备开始'

  const row = Math.floor(resultIndex.value / cols.value) + 1
  const col = (resultIndex.value % cols.value) + 1
  return `${row}排${col}列`
})

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const stop = () => {
  clearTimer()
  drawing.value = false
  resultIndex.value = -1
}

const draw = () => {
  const total = rows.value * cols.value
  if (total <= 0) return

  if (total === 1) {
    resultIndex.value = 0
    return
  }

  const finalIndex = Math.floor(Math.random() * total)
  const SPIN_COUNT = 15

  drawing.value = true
  let step = 0

  const tick = () => {
    let index = Math.floor(Math.random() * total)
    while (index === resultIndex.value) index = Math.floor(Math.random() * total)

    resultIndex.value = index
    step += 1

    if (step < SPIN_COUNT) {
      timer = setTimeout(tick, 35 + step * 18)
    }
    else {
      resultIndex.value = finalIndex
      drawing.value = false
      timer = null
    }
  }

  tick()
}

const toggle = () => {
  if (!props.interactive) return
  if (drawing.value) stop()
  else draw()
}

watch(() => [rows.value, cols.value], stop)
onUnmounted(clearTimer)
</script>

<style lang="scss" scoped>
.widget-rollcall {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}
.result {
  width: 100%;
  padding: 4px 10px 2px;
  text-align: center;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.matrix {
  flex: 1;
  display: grid;
  align-content: center;
  justify-content: center;
}
.seat {
  background-color: #e2e4e8;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color .08s;

  &.lit {
    background-color: $themeColor;
  }
}
.controls {
  display: flex;
  justify-content: center;
  padding: 2px 0 10px;

  &.static {
    pointer-events: none;
  }
}
.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background-color: $themeColor;
  cursor: pointer;
  transition: filter .2s, transform .2s, box-shadow .2s;

  &:hover {
    filter: brightness(1.15);
    transform: scale(1.06);
    box-shadow: 0 3px 10px rgba(0, 0, 0, .22);
  }
  &:active {
    transform: scale(.95);
  }

  svg {
    display: block;
    height: 45%;
    fill: #fff;
  }
}
</style>
