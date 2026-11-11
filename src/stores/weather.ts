import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchWeather } from '@/api/weather'
import type { WeatherForecast, WeatherLocation } from '@/api/types/weather'

/** 天气状态在页面切换间保留；缓存十五分钟，定位坐标不写入本地存储。 */
export const useWeatherStore = defineStore('weather', () => {
  const location = ref<WeatherLocation | null>(null)
  const forecast = ref<WeatherForecast | null>(null)
  const loading = ref(false)
  const error = ref('')
  const fetchedAt = ref(0)
  let requestId = 0

  const isStale = computed(() => Boolean(forecast.value && error.value))

  /** 补齐当前坐标的城市名称，不重新请求天气，也不覆盖已经切换的地点。 */
  const updateLocationName = (resolvedLocation: WeatherLocation) => {
    if (location.value?.latitude === resolvedLocation.latitude &&
      location.value?.longitude === resolvedLocation.longitude) {
      location.value = resolvedLocation
    }
  }

  /** 刷新所选地点，地点切换时丢弃旧数据；请求序号避免旧响应覆盖新地点。 */
  const loadWeather = async (nextLocation: WeatherLocation, force = false) => {
    const sameLocation = location.value?.latitude === nextLocation.latitude &&
      location.value?.longitude === nextLocation.longitude
    // 当地日期变化后立即失效，避免跨午夜仍将昨天的预报标为今天。
    const localDate = forecast.value
      ? new Intl.DateTimeFormat('sv-SE', { timeZone: forecast.value.timezone }).format(new Date())
      : ''
    if (!force && sameLocation && forecast.value && !error.value &&
      Date.now() - fetchedAt.value < 15 * 60 * 1000 && localDate === forecast.value.daily.time[0]) return

    const currentRequest = ++requestId
    location.value = nextLocation
    if (!sameLocation) forecast.value = null
    loading.value = true
    error.value = ''
    try {
      const result = await fetchWeather(nextLocation)
      if (currentRequest !== requestId) return
      forecast.value = result
      fetchedAt.value = Date.now()
    } catch {
      if (currentRequest === requestId) error.value = '天气获取失败，请检查网络后重试，或切换城市。'
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  return { location, forecast, loading, error, fetchedAt, isStale, loadWeather, updateLocationName }
})
