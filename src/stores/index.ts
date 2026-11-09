import { createPinia } from 'pinia'

// 组件和请求拦截器共用同一个实例。
export const pinia = createPinia()

export { useAuthStore } from './auth'
