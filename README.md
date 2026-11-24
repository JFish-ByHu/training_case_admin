# demo_admin

Vue 3 + TypeScript + Vite 配套前端，已接入 Element Plus、Axios。
使用 pnpm，Node 版本要求见 package.json（当前 Node 22.22.2 已验证）。

## 启动与检查

```sh
pnpm install
pnpm dev
pnpm build
pnpm test
```

开发服务默认 5173，/api 代理到 localhost:8080，保留 /api 前缀。
可在 .env.development 或未提交的 .env.development.local 调整 API_PROXY_TARGET。
VITE_API_BASE_URL 默认 /api。生产环境需配置服务器反向代理，或将其改为后端 API 地址；
Vite 开发代理不会随 dist 一起部署。环境文件修改后重启开发服务。

访问 / 或旧路径 /login 会转到 /dashboard。用户管理路径为 /users。

## Element Plus 自动导入

已配置 unplugin-auto-import、unplugin-vue-components 和 ElementPlusResolver。
组件与服务函数自动导入，无需 app.use(ElementPlus)。全局引入 Element Plus 基础样式与暗色变量，主色使用默认蓝色。

```vue
<script setup lang="ts">
const showSuccess = () => {
  ElMessage.success('保存成功')
}
</script>

<template>
  <ElButton type="primary" @click="showSuccess">保存</ElButton>
</template>
```

src/auto-imports.d.ts、src/components.d.ts 为插件生成的类型声明，不手工修改。
运行 pnpm dev 或构建时会根据使用情况更新。Vue 的 ref 等 API 仍显式从 vue 导入。

## 请求封装

入口为 `src/utils/request.ts`。后端返回 `{ code, data, msg }`，请求封装直接返回 `data`。填写接口路径时省略 `/api` 前缀。

```ts
import request from '@/utils/request'
import type { UserPage } from '@/api/types/users'

const result = await request.get<UserPage>('/users/list', {
  params: { page: 1, pageSize: 10 }
})
```

接口失败时抛出 `ApiError`，默认使用 Element Plus 显示提示。需要自行处理提示时可以传入 `silent: true`。请求超时为 15 秒。
