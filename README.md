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
组件与服务函数自动导入，无需 app.use(ElementPlus)。全局引入 Element Plus 基础样式与暗色变量，主色使用默认蓝色。

```vue
<script setup lang="ts">
function showSuccess() {
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

入口：src/utils/request.ts。后端约定为 { code, data, msg }，
封装直接返回 data，不需要再取 response.data.data。API 路径不重复写 /api。

```ts
import request from '@/utils/request'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore() // 在组件 setup 中调用

interface Captcha {
  captchaId: string
  captchaCode: string
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
await request.get('/users/list', { params: { page: 1, pageSize: 10 } })
await request.delete('/users/delete', { data: { id: '2' } })
await request.post<null>('/auth/logout')
authStore.removeToken()
```

- token 由 Pinia 的 auth store 管理，setToken/removeToken 同步更新状态和 sessionStorage。
  刷新页面时从 sessionStorage 恢复，普通请求自动携带 Authorization: Bearer token。
  修改 token 请使用 store 方法；组件外使用 useAuthStore(pinia)，pinia 从 @/stores 导入。
- 登录页的“记住我”在登录成功后保存账号和加密后的密码；刷新页面会自动回填。
  取消勾选会清除保存记录。密码密文与随机 IV 存在 localStorage，
  不可导出的 AES-GCM 密钥存在 IndexedDB。此方式避免明文落盘，但不能防御同源脚本读取。
- skipAuth: true 用于验证码、登录等公开接口，不携带 token。
- HTTP 错误和业务错误均 reject ApiError，保留 message、code、status。
- 即使 HTTP 200，业务 code 不在 200–299 也会 reject。
- 默认 ElMessage 显示错误；silent: true 可关闭提示，由页面自行处理。
- 401 清除 token；公开的登录请求返回 401 时不清除已有登录态。
- 登录页展示后端返回的四位数字验证码；登录失败会重新获取验证码。
- 登录成功后进入 `/dashboard` 控制台；未登录访问管理页面会跳转登录页。
- 管理页面共用 `src/layout/index.vue`；控制台使用演示数据，用户管理已接入后端分页、详情、新增、编辑、单删和批量删除接口。
- 编辑用户时新密码留空表示保持原密码；填写新密码后由后端校验并重新哈希保存，接口不会返回原密码。
- 超时 15 秒，网络失败和超时使用统一提示；主动取消不弹提示。
- 支持 Axios 配置，例如 params、headers、signal。不需要手动拼接查询字符串。
- 当前封装用于 JSON 业务接口，不用于文件下载/原始响应。

所有导出方法均为语义化小驼峰命名。Element Plus 自动导入及样式已做构建验证。
