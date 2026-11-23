<template>
  <div class="widget-center">
    <div class="header">
      <div>
        <div class="title">组件中心</div>
        <div class="subtitle">选择预设组件，或编写自己的可视化模块</div>
      </div>
    </div>

    <section class="section">
      <div class="section-head">
        <div class="section-title">预设组件</div>
        <div class="section-count">{{ WIDGET_LIST.length }} 个</div>
      </div>
      <div class="widget-grid">
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
    </section>

    <section class="section">
      <div class="section-head">
        <div class="section-title">自定义组件</div>
        <div class="section-count">{{ customList.length }} 个</div>
      </div>
      <div class="widget-grid">
        <div
          v-for="item in customList"
          :key="item.id"
          class="widget-card custom-card"
          @click="emit('select-custom', item)"
        >
          <div class="preview">
            <div class="preview-box">
              <img class="preview-img" :src="previewOf(item)" :alt="item.name" draggable="false" />
            </div>
          </div>
          <div class="info">
            <div class="name">
              <span class="name-text">{{ item.name }}</span>
              <span v-if="item.builtin" class="badge">示例</span>
            </div>
            <div class="desc">{{ item.description || '用户自定义模块' }}</div>
          </div>
          <div v-if="!item.builtin" class="card-actions">
            <button type="button" class="mini-btn" @click.stop="emit('edit-custom', item)">编辑</button>
            <button type="button" class="mini-btn danger" @click.stop="remove(item)">删除</button>
          </div>
        </div>

        <div class="widget-card add-card" @click="emit('create-custom')">
          <div class="add-plus">+</div>
          <div class="add-title">添加模块</div>
          <div class="add-desc">用 HTML / CSS / JS 编写</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { CustomModule, WidgetType } from '@/types/slides'
import { WIDGET_LIST } from '@/configs/widgets'
import { CUSTOM_MODULE_SEEDS } from '@/configs/customModuleSeeds'
import useCustomModules from '@/hooks/useCustomModules'
import customPreview from '@/assets/widgets/custom.svg'

const emit = defineEmits<{
  (event: 'select', payload: WidgetType): void
  (event: 'select-custom', payload: CustomModule): void
  (event: 'create-custom'): void
  (event: 'edit-custom', payload: CustomModule): void
}>()

const { customModules, removeModule } = useCustomModules()

const customList = computed(() => [...CUSTOM_MODULE_SEEDS, ...customModules.value])

const previewOf = (item: CustomModule) => item.preview || customPreview

const remove = (item: CustomModule) => {
  const confirmed = window.confirm(`确定删除自定义模块「${item.name}」吗？\n已插入幻灯片的模块不会受影响。`)
  if (confirmed) removeModule(item.id)
}
</script>

<style lang="scss" scoped>
.widget-center {
  width: 840px;
  max-height: 78vh;
  overflow-y: auto;
  padding-right: 4px;
}
.header {
  margin-bottom: 18px;
  padding-right: 40px;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  .subtitle {
    margin-top: 5px;
    font-size: 12px;
    color: #999;
  }
}
.section + .section {
  margin-top: 22px;
}
.section-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  .section-count {
    font-size: 11px;
    color: #aaa;
  }
}
.widget-grid {
  display: grid;
  grid-template-columns: repeat(3, 270px);
  gap: 15px;
}
.widget-card {
  position: relative;
  width: 270px;
  border: 1px solid $borderColor;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  transition: box-shadow .2s, border-color .2s, transform .2s;

  &:hover {
    border-color: $themeColor;
    box-shadow: 0 4px 10px -2px rgba(0, 0, 0, .12);
    transform: translateY(-1px);
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
      border-radius: 3px;
      background: #fff;
    }
    .preview-img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .info {
    padding: 10px 15px 12px;

    .name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
      min-width: 0;
    }
    .name-text {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .desc {
      font-size: 12px;
      color: #999;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}
.badge {
  flex: none;
  padding: 1px 5px;
  border-radius: 3px;
  background: #eef7ff;
  color: #2b7bb0;
  font-size: 10px;
  font-weight: 400;
}
.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity .2s;

  .mini-btn {
    height: 22px;
    padding: 0 8px;
    border: 1px solid #d9e2ec;
    border-radius: 3px;
    background: rgba(255, 255, 255, .95);
    color: #47627c;
    font-size: 11px;
    cursor: pointer;

    &:hover {
      border-color: $themeColor;
      color: $themeColor;
    }
    &.danger:hover {
      border-color: #d9534f;
      color: #d9534f;
    }
  }
}
.custom-card:hover .card-actions {
  opacity: 1;
}
.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 200px;
  border-style: dashed;
  background: #fbfdff;
  color: #6d8aa5;

  &:hover {
    background: #f5faff;
  }

  .add-plus {
    font-size: 30px;
    line-height: 1;
    font-weight: 300;
    color: #3d8fc4;
  }
  .add-title {
    font-size: 13px;
    font-weight: 600;
    color: #3e6f93;
  }
  .add-desc {
    font-size: 11px;
    color: #9aacbd;
  }
}
</style>
