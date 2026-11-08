<template>
  <div
    class="editable-element-widget"
    :class="{ 'lock': elementInfo.lock }"
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
        v-contextmenu="contextmenus"
        @mousedown="$event => handleSelectElement($event, false)"
        @touchstart="$event => handleSelectElement($event, false)"
        @wheel.stop
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
          @interact="handleInteract"
        />

        <div
          class="drag-handler top"
          @mousedown="$event => handleSelectElement($event)"
          @touchstart="$event => handleSelectElement($event)"
        ></div>
        <div
          class="drag-handler bottom"
          @mousedown="$event => handleSelectElement($event)"
          @touchstart="$event => handleSelectElement($event)"
        ></div>
        <div
          class="drag-handler left"
          @mousedown="$event => handleSelectElement($event)"
          @touchstart="$event => handleSelectElement($event)"
        ></div>
        <div
          class="drag-handler right"
          @mousedown="$event => handleSelectElement($event)"
          @touchstart="$event => handleSelectElement($event)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTWidgetElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import { getWidgetDefinition } from '@/configs/widgets'

import ElementOutline from '@/views/components/element/ElementOutline.vue'

const props = defineProps<{
  elementInfo: PPTWidgetElement
  selectElement: (e: MouseEvent | TouchEvent, element: PPTWidgetElement, canMove?: boolean) => void
  contextmenus: () => ContextmenuItem[] | null
}>()

const widgetComponent = computed(() => {
  return getWidgetDefinition(props.elementInfo.widgetType)?.component || null
})

const handleSelectElement = (e: MouseEvent | TouchEvent, canMove = true) => {
  if (props.elementInfo.lock) return
  e.stopPropagation()
  props.selectElement(e, props.elementInfo, canMove)
}

const handleInteract = (e: Event) => {
  props.selectElement(e as MouseEvent, props.elementInfo, false)
}
</script>

<style lang="scss" scoped>
.editable-element-widget {
  position: absolute;

  &.lock .element-content {
    cursor: default;
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
  cursor: move;
}
.drag-handler {
  position: absolute;

  &.top {
    height: 20px;
    left: 0;
    right: 0;
    top: 0;
  }
  &.bottom {
    height: 20px;
    left: 0;
    right: 0;
    bottom: 0;
  }
  &.left {
    width: 20px;
    top: 0;
    bottom: 0;
    left: 0;
  }
  &.right {
    width: 20px;
    top: 0;
    bottom: 0;
    right: 0;
  }
}
</style>
