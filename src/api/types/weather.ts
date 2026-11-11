/** 天气查询地点，城市名称由搜索或逆地理编码接口提供。 */
export interface WeatherLocation {
  name: string
  latitude: number
  longitude: number
  region?: string
}

/** Open-Meteo 城市搜索结果。 */
export interface WeatherCity extends WeatherLocation {
  id: number
  country?: string
  admin1?: string
  admin2?: string
}

/** BigDataCloud 根据当前设备坐标返回的城市和行政区信息。 */
export interface LocatedCityResult {
  city?: string
  locality?: string
  principalSubdivision?: string
  countryName?: string
}

/** Open-Meteo 预报原始结构；时间为所选地点时区下的 ISO 字符串。 */
export interface WeatherForecast {
  timezone: string
  current: {
    time: string
    temperature_2m: number | null
    apparent_temperature: number | null
    relative_humidity_2m: number | null
    precipitation: number | null
    weather_code: number | null
    is_day: number
    wind_speed_10m: number | null
    wind_direction_10m: number | null
  }
  hourly: {
    time: string[]
    temperature_2m: (number | null)[]
    precipitation_probability: (number | null)[]
    weather_code: (number | null)[]
    is_day: number[]
  }
  daily: {
    time: string[]
    weather_code: (number | null)[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
    precipitation_probability_max: (number | null)[]
    sunrise: (string | null)[]
    sunset: (string | null)[]
    uv_index_max: (number | null)[]
  }
}
