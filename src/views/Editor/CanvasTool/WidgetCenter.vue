<template>
  <div class="widget-center">
    <div class="header">
      <div class="title">组件中心</div>
    </div>
    <div class="widget-list">
      <div
        v-for="item in WIDGET_LIST"
        :key="item.type"
        class="widget-card"
        @click="emit('select', item.type)"
      >
        <div class="preview">
          <div class="preview-box">
            <img class="preview-img" :src="item.preview" :alt="item.name" draggable="false" />
          </div>
        </div>
        <div class="info">
          <div class="name">{{ item.name }}</div>
          <div class="desc">{{ item.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { WidgetType } from '@/types/slides'
import { WIDGET_LIST } from '@/configs/widgets'

const emit = defineEmits<{
  (event: 'select', payload: WidgetType): void
}>()
</script>

<style lang="scss" scoped>
.widget-center {
  width: 840px;
}
.header {
  margin-bottom: 15px;
  padding-right: 40px;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}
.widget-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
.widget-card {
  width: 270px;
  border: 1px solid $borderColor;
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow .2s, border-color .2s;

  &:hover {
    border-color: $themeColor;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, .1), 0 2px 4px -2px rgba(0, 0, 0, .1);
  }

  .preview {
    height: 140px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f7f7f7;

    .preview-box {
      width: 250px;
      height: 120px;
      overflow: hidden;
    }
    .preview-img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .info {
    padding: 10px 15px;
    background-color: #fff;

    .name {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }
    .desc {
      font-size: 12px;
      color: #999;
    }
  }
}
</style>
