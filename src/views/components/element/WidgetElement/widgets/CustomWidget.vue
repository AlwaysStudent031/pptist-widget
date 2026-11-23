<template>
  <div class="custom-widget" :style="{ backgroundColor: fill }">
    <div v-if="!data?.document" class="custom-placeholder">
      <div class="placeholder-icon">&lt;/&gt;</div>
      <div class="placeholder-text">自定义模块</div>
    </div>

    <div v-else-if="target === 'thumbnail'" class="custom-thumbnail">
      <div class="thumb-icon">&lt;/&gt;</div>
      <div class="thumb-name">{{ data.name || '自定义模块' }}</div>
      <div class="thumb-desc">自定义可视化</div>
    </div>

    <iframe
      v-else
      class="custom-frame"
      :srcdoc="data.document"
      :title="data.name || '自定义模块'"
      sandbox="allow-scripts"
      referrerpolicy="no-referrer"
      :style="{ pointerEvents: interactive ? 'auto' : 'none' }"
    ></iframe>
  </div>
</template>

<script lang="ts" setup>
import type { CustomWidgetData } from '@/types/slides'

withDefaults(defineProps<{
  data: CustomWidgetData
  width: number
  height: number
  color?: string
  fill?: string
  interactive?: boolean
  target?: string
}>(), {
  color: '#333333',
  fill: '#ffffff',
  interactive: false,
})
</script>

<style lang="scss" scoped>
.custom-widget {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.custom-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}
:global(body.pptist-modal-open) .custom-frame {
  visibility: hidden;
}
.custom-placeholder,
.custom-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: linear-gradient(135deg, #f5f9ff, #eef2ff);
  color: #507093;
}
.placeholder-icon,
.thumb-icon {
  font-family: Consolas, monospace;
  font-size: 26px;
  font-weight: 700;
  color: #2d6fa8;
  letter-spacing: 1px;
}
.placeholder-text,
.thumb-name {
  font-size: 13px;
  font-weight: 600;
}
.thumb-desc {
  font-size: 11px;
  color: #8aa0b8;
}
.custom-thumbnail .thumb-icon {
  font-size: 30px;
}
</style>
