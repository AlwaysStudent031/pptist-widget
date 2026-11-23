<template>
  <div class="custom-editor">
    <div class="editor-head">
      <div>
        <div class="title">{{ isEdit ? '编辑自定义模块' : '添加自定义模块' }}</div>
        <div class="subtitle">编写一个完整 HTML 文档，运行时会在沙箱 iframe 中显示</div>
      </div>
      <div class="head-actions">
        <Button @click="cancel">取消</Button>
        <Button type="primary" @click="save">保存并插入</Button>
      </div>
    </div>

    <div class="meta">
      <Input v-model:value="name" class="name-input" placeholder="模块名称，例如：课堂倒计时" />
      <Input v-model:value="description" class="desc-input" placeholder="一句话描述（可选）" />
    </div>

    <div class="editor-body">
      <div class="pane code-pane">
        <div class="pane-head">
          <span class="pane-title">HTML / CSS / JS</span>
          <div class="pane-tools">
            <span class="hint">完整 HTML 文档</span>
            <Button size="small" @click="insertTemplate">插入模板</Button>
          </div>
        </div>
        <textarea
          v-model="code"
          class="code-input"
          spellcheck="false"
          placeholder="在这里编写 HTML..."
        ></textarea>
      </div>

      <div class="pane preview-pane">
        <div class="pane-head">
          <span class="pane-title">实时预览</span>
          <span class="hint">可交互</span>
        </div>
        <div class="preview-body">
          <iframe
            v-if="previewCode"
            :srcdoc="previewCode"
            sandbox="allow-scripts"
            title="自定义模块预览"
          ></iframe>
          <div v-else class="preview-empty">左侧编写代码后，这里显示预览</div>
        </div>
      </div>
    </div>

    <div class="editor-foot">
      <span class="foot-hint">安全提示：模块运行在独立沙箱中，不能访问 PPT 主界面、账号或本地文件。</span>
      <span class="foot-size">代码 {{ code.length }} 字符</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import type { CustomModule } from '@/types/slides'

import Button from '@/components/Button.vue'
import Input from '@/components/Input.vue'

const props = defineProps<{
  module?: CustomModule | null
}>()

const emit = defineEmits<{
  (event: 'save', payload: CustomModule): void
  (event: 'cancel'): void
}>()

const STARTER = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    html, body {
      height: 100%;
      margin: 0;
      background: #f5f8fc;
      font-family: "Microsoft YaHei", sans-serif;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      padding: 28px 36px;
      border-radius: 16px;
      background: #fff;
      border: 1px solid #dfe8f1;
      text-align: center;
      box-shadow: 0 10px 30px rgba(30, 70, 110, .08);
    }
    h1 {
      margin: 0 0 8px;
      font-size: 22px;
      color: #1b2b40;
    }
    p {
      margin: 0 0 18px;
      font-size: 40px;
      font-weight: 700;
      color: #087fae;
    }
    button {
      padding: 9px 18px;
      border: 0;
      border-radius: 8px;
      background: #087fae;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello, PPT</h1>
    <p id="count">0</p>
    <button id="btn">点我 +1</button>
  </div>
  <script>
    let count = 0
    document.getElementById('btn').onclick = () => {
      count += 1
      document.getElementById('count').textContent = count
    }
  <\/script>
</body>
</html>`

const isEdit = computed(() => !!props.module)
const name = ref('')
const description = ref('')
const code = ref('')
const previewCode = ref('')
let previewTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.module, module => {
  name.value = module?.name || ''
  description.value = module?.description || ''
  code.value = module?.document || STARTER
}, { immediate: true })

watch(code, value => {
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(() => {
    previewCode.value = value
    previewTimer = null
  }, 300)
}, { immediate: true })

const insertTemplate = () => {
  if (code.value.trim() && !window.confirm('插入模板会覆盖当前代码，继续吗？')) return
  code.value = STARTER
}

const save = () => {
  const document = code.value.trim()
  if (!document) {
    window.alert('请先编写模块代码')
    return
  }

  emit('save', {
    id: props.module?.id || nanoid(10),
    name: name.value.trim() || '未命名模块',
    description: description.value.trim(),
    document,
    preview: props.module?.preview,
    builtin: false,
  })
}

const cancel = () => emit('cancel')

onBeforeUnmount(() => {
  if (previewTimer) clearTimeout(previewTimer)
})
</script>

<style lang="scss" scoped>
.custom-editor {
  width: 100%;
}
.editor-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 14px;

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
  .head-actions {
    flex: none;
    display: flex;
    gap: 8px;
    padding-right: 28px;
  }
}
.meta {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;

  .name-input {
    width: 300px;
    flex: none;
  }
  .desc-input {
    flex: 1;
  }
}
.editor-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 14px;
  height: min(62vh, 620px);
}
.pane {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e1e8f0;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}
.pane-head {
  height: 38px;
  flex: none;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #edf1f5;
  background: #fbfdff;

  .pane-title {
    font-size: 12px;
    font-weight: 600;
    color: #445d76;
  }
  .pane-tools {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hint {
    font-size: 11px;
    color: #9aacbd;
  }
}
.code-input {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 14px 16px;
  border: 0;
  outline: 0;
  resize: none;
  background: #fff;
  color: #23384d;
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.65;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}
.preview-body {
  flex: 1;
  min-height: 0;
  background: #f7f9fb;

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: #fff;
  }
}
.preview-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #a4b3c2;
}
.editor-foot {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  font-size: 11px;
  color: #9aacbd;

  .foot-hint {
    line-height: 1.5;
  }
  .foot-size {
    flex: none;
  }
}
@media (max-width: 900px) {
  .editor-body {
    grid-template-columns: 1fr;
    height: auto;
  }
  .preview-pane {
    height: 260px;
  }
  .meta {
    flex-direction: column;
  }
  .name-input {
    width: 100% !important;
  }
}
</style>
