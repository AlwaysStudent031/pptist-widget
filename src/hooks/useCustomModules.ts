import { ref } from 'vue'
import type { CustomModule } from '@/types/slides'

const STORAGE_KEY = 'pptist_custom_modules_v1'

const loadModules = (): CustomModule[] => {
  if (typeof localStorage === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item: unknown): item is CustomModule => {
      if (!item || typeof item !== 'object') return false
      const module = item as Partial<CustomModule>
      return typeof module.id === 'string' && typeof module.document === 'string'
    })
  }
  catch (error) {
    console.warn('读取自定义模块失败', error)
    return []
  }
}

const customModules = ref<CustomModule[]>(loadModules())

const persist = () => {
  if (typeof localStorage === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customModules.value))
  }
  catch (error) {
    console.warn('保存自定义模块失败，可能是浏览器存储空间不足', error)
  }
}

export default () => {
  const saveModule = (module: CustomModule) => {
    const list = customModules.value.slice()
    const index = list.findIndex(item => item.id === module.id)

    if (index >= 0) list[index] = module
    else list.unshift(module)

    customModules.value = list
    persist()
  }

  const removeModule = (id: string) => {
    customModules.value = customModules.value.filter(item => item.id !== id)
    persist()
  }

  return {
    customModules,
    saveModule,
    removeModule,
  }
}
