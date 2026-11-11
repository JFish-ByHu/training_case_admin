import { createPinia } from 'pinia'

/** 组件和请求拦截器共用的 Pinia 实例。 */
export const pinia = createPinia()

export { useAuthStore } from './auth'
export { useWeatherStore } from './weather'
