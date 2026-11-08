<template>
  <div class="widget-timer" :style="{ backgroundColor: fill }">
    <div class="time-display" :style="{ color, fontSize: displayFontSize + 'px' }">{{ display }}</div>
    <div class="controls" :class="{ static: !interactive }">
      <div
        class="control-btn"
        :class="{ pill: isActive }"
        :style="{
          width: (isActive ? buttonSize * 2 : buttonSize) + 'px',
          height: buttonSize + 'px',
          borderRadius: buttonSize / 2 + 'px',
        }"
        @mousedown.stop
        @touchstart.stop
        @click.stop="emit('interact', $event)"
      >
        <template v-if="finished">
          <button type="button" class="btn-action" title="停止" @click="reset()">
            <svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
          </button>
        </template>
        <template v-else-if="isActive">
          <button v-if="running" type="button" class="btn-action" title="暂停" @click="pause()">
            <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          </button>
          <button v-else type="button" class="btn-action" title="继续" @click="start()">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
          <button type="button" class="btn-action" title="停止" @click="reset()">
            <svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
          </button>
        </template>
        <template v-else>
          <button type="button" class="btn-action" title="开始" @click="start()">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import type { TimerWidgetData } from '@/types/slides'

const props = withDefaults(defineProps<{
  data: TimerWidgetData
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

const MAX_SECONDS = 5999

const elapsed = ref(0)
const running = ref(false)
const finished = ref(false)

let timer: ReturnType<typeof setInterval> | null = null

const mode = computed(() => props.data?.mode || 'countdown')
const duration = computed(() => {
  const value = Number(props.data?.duration)
  return Number.isFinite(value) ? Math.max(0, Math.min(MAX_SECONDS, value)) : 0
})

const remaining = computed(() => {
  if (mode.value === 'stopwatch') return elapsed.value
  return Math.max(0, duration.value - elapsed.value)
})

const display = computed(() => {
  const minutes = Math.floor(remaining.value / 60)
  const seconds = remaining.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// 字号随组件尺寸自适应
const displayFontSize = computed(() => {
  const byHeight = props.height * 0.4
  const byWidth = props.width / (display.value.length * 0.62)
  return Math.max(12, Math.min(byHeight, byWidth))
})

const buttonSize = computed(() => {
  return Math.max(28, Math.min(props.height * 0.3, props.width * 0.3, 64))
})

const isActive = computed(() => (running.value || elapsed.value > 0) && !finished.value)

const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const pause = () => {
  running.value = false
  clearTimer()
}

const reset = () => {
  pause()
  finished.value = false
  elapsed.value = 0
}

const start = () => {
  if (!props.interactive || running.value) return

  running.value = true
  clearTimer()

  timer = setInterval(() => {
    elapsed.value += 1

    const reached = mode.value === 'countdown' ? remaining.value <= 0 : elapsed.value >= MAX_SECONDS
    if (reached) {
      pause()
      finished.value = true
    }
  }, 1000)
}

watch(() => [props.data?.mode, props.data?.duration], reset)
onUnmounted(clearTimer)
</script>

<style lang="scss" scoped>
.widget-timer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.time-display {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: .02em;
  white-space: nowrap;
}
.controls {
  display: flex;
  justify-content: center;
  padding: 0 10px 12px;

  &.static {
    pointer-events: none;
  }
}
.control-btn {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background-color: $themeColor;
  transition: width .2s, filter .2s, transform .2s, box-shadow .2s;

  &:hover {
    filter: brightness(1.15);
    transform: scale(1.06);
    box-shadow: 0 3px 10px rgba(0, 0, 0, .22);
  }
  &:active {
    transform: scale(.95);
  }
}
.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color .15s;

  svg {
    display: block;
    height: 45%;
    fill: #fff;
  }

  &:hover {
    background-color: rgba(255, 255, 255, .3);
  }
}
.control-btn.pill {
  .btn-action:first-child svg {
    transform: translate(12%);
  }
  .btn-action:last-child svg {
    transform: translate(-12%);
  }
}
</style>
