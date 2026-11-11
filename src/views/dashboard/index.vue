<script setup lang="ts">
/** 天气控制台：定位或搜索城市，展示所选地点的当前天气和预报。 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Location, Refresh, Search } from '@element-plus/icons-vue'
import WeatherAnimation from '@/components/weather/WeatherAnimation.vue'
import { resolveLocatedCity, searchWeatherCities } from '@/api/weather'
import type { WeatherCity, WeatherLocation } from '@/api/types/weather'
import { useWeatherStore } from '@/stores'
import { describeWeather, formatWeatherDate, formatWeatherValue } from '@/utils/weather'

const weatherStore = useWeatherStore()
const { forecast, location, loading, error, isStale } = storeToRefs(weatherStore)
const cityQuery = ref('')
const cities = ref<WeatherCity[]>([])
const searching = ref(false)
const searched = ref(false)
const searchError = ref('')
const locating = ref(false)
const locationError = ref('')
const resolvingCity = ref(false)
let searchController: AbortController | undefined
let locationController: AbortController | undefined
let locationRequestId = 0

const condition = computed(() =>
  describeWeather(forecast.value?.current.weather_code, forecast.value?.current.is_day !== 0)
)
const today = computed(() => forecast.value?.daily.time[0] ?? '')
const hourlyRows = computed(() => {
  const data = forecast.value
  if (!data) return []
  // 时间字符串均属于地点当地时区，从当前预报所在小时开始展示。
  return data.hourly.time
    .map((time, index) => ({
      time,
      temperature: data.hourly.temperature_2m[index],
      rain: data.hourly.precipitation_probability[index],
      condition: describeWeather(data.hourly.weather_code[index], data.hourly.is_day[index] !== 0)
    }))
    .filter(item => item.time >= data.current.time.slice(0, 13) + ':00')
    .slice(0, 24)
})
const dailyRows = computed(() => {
  const data = forecast.value?.daily
  return (
    data?.time.map((date, index) => ({
      date,
      label: formatWeatherDate(date, today.value),
      condition: describeWeather(data.weather_code[index]),
      high: data.temperature_2m_max[index],
      low: data.temperature_2m_min[index],
      rain: data.precipitation_probability_max[index]
    })) ?? []
  )
})
const metrics = computed(() => {
  const data = forecast.value
  return [
    {
      label: '体感温度',
      value: formatWeatherValue(data?.current.apparent_temperature, '°C'),
      note: '当前体感'
    },
    {
      label: '相对湿度',
      value: formatWeatherValue(data?.current.relative_humidity_2m, '%'),
      note: '当前空气湿度'
    },
    {
      label: '风速',
      value: formatWeatherValue(data?.current.wind_speed_10m, ' km/h', 1),
      note: '距地面 10 米'
    },
    {
      label: '今日降水概率',
      value: formatWeatherValue(data?.daily.precipitation_probability_max[0], '%'),
      note: '今日最高概率'
    }
  ]
})

/** 新搜索取消旧请求；输入变化后隐藏旧城市选项。 */
const clearCitySearch = () => {
  searchController?.abort()
  searching.value = false
  searched.value = false
  cities.value = []
  searchError.value = ''
}

const searchCities = async () => {
  clearCitySearch()
  if (cityQuery.value.trim().length < 2) {
    searchError.value = '请输入至少两个字符，可使用中文城市名或拼音。'
    return
  }
  const controller = new AbortController()
  searchController = controller
  searching.value = true
  try {
    const result = await searchWeatherCities(cityQuery.value, controller.signal)
    if (controller.signal.aborted) return
    cities.value = result
    searched.value = true
  } catch {
    if (!controller.signal.aborted) searchError.value = '城市搜索失败，请检查网络后重试。'
  } finally {
    if (searchController === controller) searching.value = false
  }
}

/** 手动选城会作废等待中的定位结果，避免覆盖用户选择。 */
const selectCity = (city: WeatherCity) => {
  locationRequestId++
  locationController?.abort()
  resolvingCity.value = false
  locating.value = false
  locationError.value = ''
  cityQuery.value = city.name
  clearCitySearch()
  void weatherStore.loadWeather(city)
}

/** 城市名称与天气分别请求；名称解析失败不影响按坐标显示天气。 */
const loadLocatedCityName = async (detectedLocation: WeatherLocation, requestId: number) => {
  const controller = new AbortController()
  locationController = controller
  resolvingCity.value = true
  try {
    const resolved = await resolveLocatedCity(detectedLocation, controller.signal)
    if (requestId !== locationRequestId) return
    weatherStore.updateLocationName(resolved)
  } catch {
    if (requestId === locationRequestId && !controller.signal.aborted) {
      locationError.value = '已获取定位坐标，但城市名称解析失败；仍可查看当地天气，或手动搜索城市。'
    }
  } finally {
    if (requestId === locationRequestId) resolvingCity.value = false
  }
}

/** 浏览器请求定位授权；拒绝或超时后仍可搜索城市。 */
const locateWeather = async () => {
  if (locating.value) return
  locationController?.abort()
  resolvingCity.value = false
  locationError.value = ''
  if (!window.isSecureContext || !navigator.geolocation) {
    locationError.value = '当前环境不支持定位，请搜索城市；浏览器定位需要 HTTPS 或 localhost。'
    return
  }
  const requestId = ++locationRequestId
  locating.value = true
  let detectedLocation: WeatherLocation | undefined
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000
      })
    })
    detectedLocation = {
      name: '当前位置',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      region: '浏览器定位'
    }
  } catch (failure) {
    if (requestId !== locationRequestId) return
    const code = (failure as GeolocationPositionError).code
    locationError.value =
      code === 1
        ? '定位授权未开启，请手动搜索城市，或允许定位后重试。'
        : code === 3
          ? '定位超时，请重试或手动搜索城市。'
          : '暂时无法获取位置，请手动搜索城市。'
  } finally {
    if (requestId === locationRequestId) locating.value = false
  }
  if (requestId === locationRequestId && detectedLocation) {
    clearCitySearch()
    cityQuery.value = ''
    await Promise.all([
      weatherStore.loadWeather(detectedLocation),
      loadLocatedCityName(detectedLocation, requestId)
    ])
  }
}

const refreshWeather = () => {
  if (location.value) void weatherStore.loadWeather(location.value, true)
}

onMounted(() => {
  if (location.value) void weatherStore.loadWeather(location.value)
  else void locateWeather()
})
onBeforeUnmount(() => {
  searchController?.abort()
  locationController?.abort()
  locationRequestId++
})
</script>

<template>
  <section class="weather-dashboard" aria-labelledby="weather-title">
    <header class="page-heading">
      <div>
        <p id="weather-title" class="eyebrow">控制台 / 天气概览</p>
      </div>
      <div class="page-actions">
        <ElButton :icon="Location" :loading="locating" @click="locateWeather">定位当地</ElButton>
        <ElButton
          :icon="Refresh"
          :loading="loading"
          :disabled="!location || locating"
          @click="refreshWeather"
          >刷新天气</ElButton
        >
      </div>
    </header>

    <section class="location-panel panel" aria-label="选择天气城市">
      <form class="search-form" @submit.prevent="searchCities">
        <label for="weather-city">切换城市</label>
        <ElInput
          id="weather-city"
          v-model="cityQuery"
          class="city-input"
          placeholder="城市名或拼音，如杭州 / Hangzhou"
          clearable
          :prefix-icon="Search"
          @input="clearCitySearch"
        />
        <ElButton type="primary" native-type="submit" :loading="searching">搜索</ElButton>
      </form>
      <p v-if="searchError" class="feedback error-text" role="alert">{{ searchError }}</p>
      <p v-else-if="searched && !cities.length" class="feedback" role="status">
        没有找到匹配城市，试试拼音或添加省份、国家名称。
      </p>
      <div v-if="cities.length" class="city-results" aria-label="城市搜索结果">
        <button
          v-for="city in cities"
          :key="city.id"
          type="button"
          class="city-option"
          @click="selectCity(city)"
        >
          <strong>{{ city.name }}</strong
          ><span>{{ city.region || '地区信息未提供' }}</span>
        </button>
      </div>
    </section>

    <ElAlert
      v-if="locationError"
      :title="locationError"
      type="warning"
      show-icon
      :closable="false"
    />
    <ElAlert
      v-if="error"
      :title="error"
      :description="isStale ? '以下保留上次获取的数据，请留意天气时间。' : undefined"
      type="error"
      show-icon
      :closable="false"
    />
    <p v-if="locating" class="feedback" role="status">
      正在获取位置，请在浏览器提示中允许定位；也可以直接搜索城市。
    </p>
    <p v-if="resolvingCity" class="feedback" role="status">已获取位置，正在识别所在城市…</p>
    <p v-if="loading && forecast" class="feedback" role="status">正在刷新天气，暂时展示上次数据…</p>

    <div
      v-if="loading && !forecast"
      class="panel loading-panel"
      role="status"
      aria-label="正在获取天气"
    >
      <ElSkeleton :rows="6" animated />
    </div>
    <template v-else-if="forecast && location">
      <section class="current-weather panel" aria-label="当前天气">
        <div class="current-summary">
          <div class="current-info">
            <div class="location-heading">
              <h2>{{ location.name }}</h2>
              <ElTag :type="isStale ? 'warning' : 'primary'" effect="plain">{{
                isStale ? '上次数据' : '当前天气'
              }}</ElTag>
            </div>
            <p class="muted">{{ location.region }} · {{ today }}</p>
            <div class="temperature-row">
              <strong class="temperature">{{
                formatWeatherValue(forecast.current.temperature_2m, '°')
              }}</strong>
              <div>
                <p class="condition">{{ condition.text }}</p>
                <p class="muted">摄氏度 °C</p>
              </div>
            </div>
            <p class="temperature-range">
              今日 {{ formatWeatherValue(forecast.daily.temperature_2m_min[0], '°') }} /
              {{ formatWeatherValue(forecast.daily.temperature_2m_max[0], '°') }}
            </p>
            <p class="update-time">
              天气时间 {{ forecast.current.time.replace('T', ' ') }} · {{ forecast.timezone }}
            </p>
          </div>
        </div>
        <div class="day-summary">
          <div class="current-animation" aria-hidden="true">
            <WeatherAnimation :icon="condition.icon" :size="240" />
          </div>
          <div class="sun-times">
            <div>
              <WeatherAnimation icon="sunrise" :size="48" :animated="false" /><span>日出</span
              ><strong>{{ forecast.daily.sunrise[0]?.slice(11, 16) || '—' }}</strong>
            </div>
            <div>
              <WeatherAnimation icon="sunset" :size="48" :animated="false" /><span>日落</span
              ><strong>{{ forecast.daily.sunset[0]?.slice(11, 16) || '—' }}</strong>
            </div>
          </div>
          <div class="day-detail">
            <span>今日最高紫外线指数</span
            ><strong>{{ formatWeatherValue(forecast.daily.uv_index_max[0], '', 1) }}</strong>
          </div>
          <div class="day-detail">
            <span>当前时段降水量</span
            ><strong>{{ formatWeatherValue(forecast.current.precipitation, ' mm', 1) }}</strong>
          </div>
        </div>
      </section>

      <section class="metric-grid" aria-label="天气指标">
        <article v-for="metric in metrics" :key="metric.label" class="panel metric">
          <p>{{ metric.label }}</p>
          <strong>{{ metric.value }}</strong
          ><span>{{ metric.note }}</span>
        </article>
      </section>

      <section class="panel forecast-panel" aria-labelledby="hourly-title">
        <div class="section-heading">
          <h2 id="hourly-title">未来 24 小时</h2>
          <span class="muted">当地时间 · 降水概率</span>
        </div>
        <div class="hourly-scroll" tabindex="0" role="region" aria-label="逐小时天气，可左右滚动">
          <article v-for="(hour, index) in hourlyRows" :key="hour.time" class="hour-item">
            <time :datetime="hour.time">{{
              index === 0 ? '当前小时' : hour.time.slice(11, 16)
            }}</time>
            <span class="hour-date">{{ hour.time.slice(5, 10) }}</span>
            <WeatherAnimation :icon="hour.condition.icon" :size="52" :animated="false" />
            <strong>{{ formatWeatherValue(hour.temperature, '°') }}</strong>
            <span>{{ hour.condition.text }}</span>
            <span class="rain-value">{{ formatWeatherValue(hour.rain, '%') }}</span>
          </article>
        </div>
      </section>

      <section class="panel forecast-panel" aria-labelledby="daily-title">
        <div class="section-heading">
          <h2 id="daily-title">7 天预报</h2>
          <span class="muted">最低 / 最高温度</span>
        </div>
        <div class="daily-grid">
          <article
            v-for="day in dailyRows"
            :key="day.date"
            class="day-item"
            :class="{ 'is-today': day.date === today }"
          >
            <strong>{{ day.label }}</strong
            ><time :datetime="day.date">{{ day.date.slice(5, 10) }}</time>
            <WeatherAnimation :icon="day.condition.icon" :size="64" :animated="false" />
            <span>{{ day.condition.text }}</span>
            <p>
              <span class="muted">{{ formatWeatherValue(day.low, '°') }}</span> /
              {{ formatWeatherValue(day.high, '°') }}
            </p>
            <span class="rain-value">降水 {{ formatWeatherValue(day.rain, '%') }}</span>
          </article>
        </div>
      </section>
    </template>
    <div v-else-if="!locating" class="panel empty-panel">
      <ElEmpty
        :description="
          error ? '暂时无法显示天气，请刷新重试或选择其他城市' : '搜索城市或允许定位，查看当地天气'
        "
      >
        <ElButton v-if="location" type="primary" @click="refreshWeather">重试天气请求</ElButton>
        <ElButton v-else type="primary" :icon="Location" @click="locateWeather"
          >获取当地天气</ElButton
        >
      </ElEmpty>
    </div>

    <footer class="weather-footer">
      <span
        >天气数据由
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
        提供（<a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
          >CC BY 4.0</a
        >） · 城市数据来自
        <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer"
          >GeoNames</a
        ></span
      >
      <span
        >城市识别由
        <a href="https://www.bigdatacloud.com/" target="_blank" rel="noopener noreferrer"
          >BigDataCloud</a
        >
        提供 · 图标来自 <a href="https://github.com/basmilius/weather-icons" target="_blank" rel="noopener noreferrer">Meteocons</a> · 时间以所选地点为准</span
      >
    </footer>
  </section>
</template>

<style scoped>
.weather-dashboard {
  display: grid;
  gap: 20px;
  width: 100%;
  min-width: 0;
}
.page-heading,
.section-heading,
.location-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.eyebrow {
  margin-bottom: 8px;
  color: var(--el-color-primary);
  font-size: 13px;
}
h1 {
  font-size: 28px;
  font-weight: 650;
}
h2 {
  font-size: 18px;
  font-weight: 600;
}
.subtitle {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.page-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.panel {
  min-width: 0;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-bg-color);
}
.location-panel {
  padding: 16px 20px;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.search-form label {
  font-size: 14px;
}
.city-input {
  flex: 1;
  max-width: 440px;
  min-width: 180px;
}
.feedback {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
}
.location-panel .feedback {
  margin-top: 12px;
}
.error-text {
  color: var(--el-color-danger);
}
.city-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  margin-top: 16px;
}
.city-option {
  display: grid;
  gap: 6px;
  padding: 12px;
  text-align: left;
  font: inherit;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
}
.city-option span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.city-option:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.city-option:focus-visible,
.hourly-scroll:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 3px;
}
.loading-panel {
  padding: 32px;
}
.current-weather {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
}
.current-summary {
  padding: 28px 32px;
  background: linear-gradient(120deg, var(--el-color-primary-light-9), var(--el-bg-color));
  border-radius: 8px 0 0 8px;
}
.current-info { min-width: 0; }
.current-animation { display: flex; align-items: center; justify-content: center; min-width: 0; }
.location-heading {
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.location-heading h2 {
  font-size: 24px;
  overflow-wrap: anywhere;
}
.muted {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.temperature-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 22px;
  margin: 24px 0 16px;
}
.temperature {
  font-size: clamp(48px, 5vw, 76px);
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.rain-value {
  color: var(--el-color-primary);
}
.condition {
  margin-bottom: 8px;
  font-size: 18px;
}
.temperature-range {
  font-size: 15px;
}
.update-time {
  margin-top: 18px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.day-summary {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: 28px 32px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.sun-times {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 8px;
}
.sun-times > div {
  display: grid;
  justify-items: center;
  gap: 10px;
}
.sun-times span,
.day-detail {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.sun-times strong {
  font-size: 22px;
  font-weight: 500;
}
.day-detail {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.day-detail strong {
  color: var(--el-text-color-primary);
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.metric {
  display: grid;
  gap: 16px;
  padding: 20px;
}
.metric p {
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.metric strong {
  font-size: 28px;
  font-weight: 550;
  font-variant-numeric: tabular-nums;
}
.metric > span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.forecast-panel {
  padding: 22px;
}
.section-heading {
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.hourly-scroll {
  display: flex;
  overflow-x: auto;
  padding-bottom: 12px;
  scrollbar-width: thin;
}
.hour-item {
  display: flex;
  flex: 0 0 94px;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  font-size: 13px;
  border-right: 1px solid var(--el-border-color-lighter);
}
.hour-item:last-child {
  border-right: 0;
}
.hour-item strong {
  font-size: 22px;
  font-weight: 500;
}
.hour-date {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.daily-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}
.day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 20px 8px;
  font-size: 14px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
}
.day-item.is-today {
  background: var(--el-color-primary-light-9);
}
.day-item time,
.day-item .rain-value {
  font-size: 12px;
}
.day-item time {
  color: var(--el-text-color-secondary);
}
.weather-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
}
.weather-footer a {
  color: var(--el-color-primary);
  text-decoration: underline;
}
@media (max-width: 1100px) {
  .daily-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .current-summary,
  .day-summary {
    padding: 24px;
  }
}
@media (max-width: 768px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .current-weather {
    grid-template-columns: 1fr;
  }
  .current-summary {
    border-radius: 8px 8px 0 0;
  }
  .day-summary {
    border-left: 0;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  .current-animation { display: none; }
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .daily-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .search-form label {
    width: 100%;
  }
  .city-input {
    min-width: 0;
  }
  .location-panel,
  .forecast-panel {
    padding: 16px;
  }
  .city-results {
    grid-template-columns: 1fr;
  }
  .metric {
    padding: 16px;
  }
  .metric strong {
    font-size: 23px;
  }
}
@media (max-width: 520px) {
  .current-summary { padding: 20px 16px; }
  .temperature-row { gap: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .loading-panel :deep(.el-skeleton__item) {
    animation: none;
  }
}
</style>
