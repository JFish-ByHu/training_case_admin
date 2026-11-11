import type { WeatherAppearance } from '@/components/weather/types'

/** 将 WMO 天气代码映射为中文描述与 Meteocons 图标，支持白天和夜间。 */
export const describeWeather = (code: number | null | undefined, isDay = true): WeatherAppearance => {
  const period = isDay ? 'day' : 'night'
  if (code === 0) return { text: isDay ? '晴' : '晴朗', icon: `clear-${period}` }
  if (code === 1) return { text: '大部晴朗', icon: `partly-cloudy-${period}` }
  if (code === 2) return { text: '多云', icon: `partly-cloudy-${period}` }
  if (code === 3) return { text: '阴', icon: 'overcast' }
  if (code === 45 || code === 48) return { text: code === 48 ? '雾凇' : '雾', icon: `fog-${period}` }
  if ([51, 53, 55].includes(code ?? -1)) return { text: '毛毛雨', icon: 'drizzle' }
  if ([56, 57, 66, 67].includes(code ?? -1)) return { text: '冻雨', icon: 'sleet' }
  if ([61, 63, 65].includes(code ?? -1)) return { text: code === 61 ? '小雨' : code === 63 ? '中雨' : '大雨', icon: 'rain' }
  if ([71, 73, 75, 77].includes(code ?? -1)) return { text: code === 71 ? '小雪' : code === 73 ? '中雪' : code === 75 ? '大雪' : '米雪', icon: 'snow' }
  if ([80, 81, 82].includes(code ?? -1)) return { text: '阵雨', icon: `partly-cloudy-${period}-rain` }
  if (code === 85 || code === 86) return { text: '阵雪', icon: `partly-cloudy-${period}-snow` }
  if (code === 95) return { text: '雷暴', icon: `thunderstorms-${period}-rain` }
  if (code === 96 || code === 99) return { text: '雷暴伴冰雹', icon: 'hail' }
  return { text: '暂无天气描述', icon: 'not-available' }
}

/** 缺失观测值显示占位符，避免将 null 显示为零。 */
export const formatWeatherValue = (value: number | null | undefined, unit = '', digits = 0) =>
  value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(digits)}${unit}`

/** ISO 日期不经浏览器时区转换，避免把远程城市日期显示为本机日期。 */
export const formatWeatherDate = (date: string, today: string) => {
  if (date === today) return '今天'
  return new Intl.DateTimeFormat('zh-CN', { weekday: 'short', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`))
}
