<template>
  <div
    class="base-element-widget"
    :class="{ 'is-thumbnail': target === 'thumbnail' }"
    :style="{
      top: elementInfo.top + 'px',
      left: elementInfo.left + 'px',
      width: elementInfo.width + 'px',
      height: elementInfo.height + 'px',
    }"
  >
    <div
      class="rotate-wrapper"
      :style="{ transform: `rotate(${elementInfo.rotate}deg)` }"
    >
      <div class="element-content" :style="{ backgroundColor: elementInfo.fill }">
        <ElementOutline
          :width="elementInfo.width"
          :height="elementInfo.height"
          :outline="elementInfo.outline"
        />
        <component
          :is="widgetComponent"
          v-if="widgetComponent"
          :data="elementInfo.data"
          :width="elementInfo.width"
          :height="elementInfo.height"
          :color="elementInfo.color"
          :fill="elementInfo.fill"
          :interactive="interactive"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTWidgetElement } from '@/types/slides'
import { getWidgetDefinition } from '@/configs/widgets'

import ElementOutline from '@/views/components/element/ElementOutline.vue'

const props = withDefaults(defineProps<{
  elementInfo: PPTWidgetElement
  interactive?: boolean
  target?: string
}>(), {
  interactive: false,
})

const widgetComponent = computed(() => {
  return getWidgetDefinition(props.elementInfo.widgetType)?.component || null
})
</script>

<style lang="scss" scoped>
.base-element-widget {
  position: absolute;

  &.is-thumbnail {
    pointer-events: none;
  }
}
.rotate-wrapper {
  width: 100%;
  height: 100%;
}
.element-content {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
