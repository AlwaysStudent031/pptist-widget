<template>
  <div
    class="base-element-widget screen-element-widget"
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
      <div
        class="element-content"
        :style="{ backgroundColor: elementInfo.fill }"
        @wheel.stop
        @touchstart.stop
        @touchend.stop
      >
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
          :interactive="true"
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

const props = defineProps<{
  elementInfo: PPTWidgetElement
}>()

const widgetComponent = computed(() => {
  return getWidgetDefinition(props.elementInfo.widgetType)?.component || null
})
</script>

<style lang="scss" scoped>
.screen-element-widget {
  position: absolute;
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
