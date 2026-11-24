import { createPinia } from 'pinia'

/** 应用共用的 Pinia 实例。 */
export const pinia = createPinia()

export { useWeatherStore } from './weather'
