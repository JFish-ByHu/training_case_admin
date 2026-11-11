import axios from 'axios'
import type { LocatedCityResult, WeatherCity, WeatherForecast, WeatherLocation } from './types/weather'

// 第三方接口使用独立实例：不携带后台 token，也不解析后台的 code/data/msg 协议。
const weatherClient = axios.create({ timeout: 15000, withCredentials: false })

/**
 * 将浏览器取得的当前设备坐标转换为中文城市名称。
 * 此免费接口仅供客户端查询自身位置，不能用于服务端或任意坐标批量查询。
 * @param location 浏览器授权定位得到的地点。
 * @param signal 用户切换城市或离开页面时取消请求。
 * @returns 保留原始坐标、补齐城市与行政区名称的地点。
 */
export const resolveLocatedCity = async (location: WeatherLocation, signal?: AbortSignal): Promise<WeatherLocation> => {
  const { data } = await weatherClient.get<LocatedCityResult>(
    'https://api.bigdatacloud.net/data/reverse-geocode-client',
    {
      params: { latitude: location.latitude, longitude: location.longitude, localityLanguage: 'zh' },
      timeout: 8000,
      signal
    }
  )
  const name = data.city?.trim() || data.locality?.trim()
  if (!name) throw new Error('无法解析城市名称')
  const region = [...new Set([data.principalSubdivision, data.countryName]
    .filter(value => value && value !== name))].join(' · ')
  return { ...location, name, region: region || '浏览器定位' }
}

/**
 * 按城市名搜索地点，返回可区分同名城市的行政区信息。
 * @param name 城市名称，至少两个字符，可使用中文或拼音。
 * @param signal 用于取消过期搜索的信号。
 * @returns 匹配的城市列表，没有匹配时返回空数组。
 */
export const searchWeatherCities = async (name: string, signal?: AbortSignal): Promise<WeatherCity[]> => {
  if (name.trim().length < 2) return []
  const { data } = await weatherClient.get<{ results?: WeatherCity[] }>(
    'https://geocoding-api.open-meteo.com/v1/search',
    { params: { name: name.trim(), count: 8, language: 'zh', format: 'json' }, signal }
  )
  return (data.results ?? []).map(city => ({
    ...city,
    region: [...new Set([city.admin2, city.admin1, city.country].filter(Boolean))].join(' · ')
  }))
}

/**
 * 获取地点当前天气、逐小时预报和七天预报，无需 API Key。
 * @param location 经纬度查询地点。
 * @returns 按地点当地时区返回的预报，温度为摄氏度，风速为公里/小时。
 */
export const fetchWeather = async (location: WeatherLocation): Promise<WeatherForecast> => {
  const { data } = await weatherClient.get<WeatherForecast>('https://api.open-meteo.com/v1/forecast', {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: 'auto',
      forecast_days: 7,
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,is_day,wind_speed_10m,wind_direction_10m',
      hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max'
    }
  })
  if (!data.current?.time || !data.daily?.time?.length || !data.hourly?.time?.length || !data.timezone) {
    throw new Error('天气数据暂不完整，请稍后重试')
  }
  return data
}
