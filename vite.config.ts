import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

// 允许通过环境变量追加可访问的域名（例如临时隧道、内网域名）
const extraAllowedHosts = (process.env.PPTIST_ALLOWED_HOSTS || '')
  .split(',')
  .map(host => host.trim())
  .filter(Boolean)

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    vue(),
    Components({
      dirs: [],
      resolvers: [
        IconsResolver({
          prefix: 'i',
          customCollections: ['custom'],
        }),
      ],
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: false, 
      customCollections: {
        custom: FileSystemIconLoader('src/assets/icons'),
      },
      scale: 1,
      defaultClass: 'i-icon',
    }),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    allowedHosts: ['localhost', '127.0.0.1', ...extraAllowedHosts],
    watch: {
      // 编辑器原子写入产生的临时文件/目录，避免开发服务器监听时崩溃
      ignored: ['**/*.tmp', '**/*.tmpdir/**'],
    },
    proxy: {
      '/api': {
        target: 'https://server.pptist.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['localhost', '127.0.0.1', ...extraAllowedHosts],
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import '@/assets/styles/variable.scss';
          @import '@/assets/styles/mixin.scss';
        `
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
