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

## Element Plus 自动导入

已配置 unplugin-auto-import、unplugin-vue-components 和 ElementPlusResolver。
组件、服务函数及所需样式按需导入，无需 app.use(ElementPlus) 或全量样式。

```vue
<script setup lang="ts">
function showSuccess() {
  ElMessage.success('保存成功')
}
</script>

<template>
  <el-button type="primary" @click="showSuccess">保存</el-button>
</template>
```

src/auto-imports.d.ts、src/components.d.ts 为插件生成的类型声明，不手工修改。
运行 pnpm dev 或构建时会根据使用情况更新。Vue 的 ref 等 API 仍显式从 vue 导入。

## 请求封装

入口：src/utils/request.ts。后端约定为 { code, data, msg }，
封装直接返回 data，不需要再取 response.data.data。API 路径不重复写 /api。

```ts
import request from '@/utils/request'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore() // 在组件 setup 中调用

interface Captcha {
  captchaId: string
  image: string
  expiresIn: number
}

const captcha = await request.get<Captcha>('/auth/captcha', { skipAuth: true })

interface LoginResult {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: { id: string; username: string; role: 'ADMIN' | 'USER' }
}

const result = await request.post<LoginResult>('/auth/login', {
  username: 'admin',
  password: '<用户输入的密码>',
  captchaId: captcha.captchaId,
  captchaCode: '<用户输入的验证码>'
}, { skipAuth: true })

authStore.setToken(result.accessToken)

await request.patch('/users/me', { nickname: 'Student' })
await request.get('/users', { params: { page: 1, pageSize: 10 } })
await request.delete('/users/2')
await request.post<null>('/auth/logout')
authStore.removeToken()
```

- token 由 Pinia 的 auth store 管理，setToken/removeToken 同步更新状态和 sessionStorage。
  刷新页面时从 sessionStorage 恢复，普通请求自动携带 Authorization: Bearer token。
  修改 token 请使用 store 方法；组件外使用 useAuthStore(pinia)，pinia 从 @/stores 导入。
- skipAuth: true 用于验证码、登录等公开接口，不携带 token。
- HTTP 错误和业务错误均 reject ApiError，保留 message、code、status。
- 即使 HTTP 200，业务 code 不在 200–299 也会 reject。
- 默认 ElMessage 显示错误；silent: true 可关闭提示，由页面自行处理。
- 401 清除 token；当前尚无登录页面，不强制跳转，后续由登录页/路由守卫处理。
  skipAuth 请求返回 401 不清除已有登录态。
- 超时 15 秒，网络失败和超时使用统一提示；主动取消不弹提示。
- 支持 Axios 配置，例如 params、headers、signal。不需要手动拼接查询字符串。
- 当前封装用于 JSON 业务接口，不用于文件下载/原始响应。

所有导出方法均为语义化小驼峰命名。请求拦截器测试使用模拟适配器，
不依赖后端服务；Element Plus 自动导入及样式已做构建验证。
