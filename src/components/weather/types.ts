/** 项目内置的 Meteocons 图标名称，与本地 SVG 文件一一对应。 */
export type WeatherIconName =
  | 'clear-day' | 'clear-night'
  | 'partly-cloudy-day' | 'partly-cloudy-night' | 'overcast'
  | 'fog-day' | 'fog-night' | 'drizzle' | 'sleet' | 'rain' | 'snow'
  | 'partly-cloudy-day-rain' | 'partly-cloudy-night-rain'
  | 'partly-cloudy-day-snow' | 'partly-cloudy-night-snow'
  | 'thunderstorms-day-rain' | 'thunderstorms-night-rain' | 'hail'
  | 'not-available' | 'sunrise' | 'sunset'

/** WMO 天气代码对应的中文描述和统一图标。 */
export interface WeatherAppearance {
  text: string
  icon: WeatherIconName
}
