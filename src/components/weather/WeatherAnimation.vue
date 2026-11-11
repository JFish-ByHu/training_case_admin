<script setup lang="ts">
import { computed } from 'vue'
import type { WeatherIconName } from './types'

/**
 * 通用天气图标：主卡片可启用动画，列表传入 animated=false 使用静态图标。
 * label 为空时作为装饰图；减少动态效果模式始终使用真正移除动画的 SVG。
 */
const props = withDefaults(defineProps<{
  icon: WeatherIconName
  animated?: boolean
  size?: number
  label?: string
}>(), { animated: true, size: 240, label: '' })

// 显式纳入本地资源，构建时生成带哈希的 URL，无需运行时请求第三方 CDN。
const assets = import.meta.glob<string>('../../assets/weather/*/*.svg', {
  eager: true, query: '?url', import: 'default'
})
const staticSource = computed(() => assets[`../../assets/weather/static/${props.icon}.svg`])
const imageSource = computed(() => props.animated
  ? assets[`../../assets/weather/animated/${props.icon}.svg`]
  : staticSource.value)
</script>

<template>
  <picture class="weather-animation" :style="{ width: `${size}px` }" :aria-hidden="label ? undefined : true">
    <source media="(prefers-reduced-motion: reduce)" :srcset="staticSource" />
    <img :src="imageSource" :alt="label" :width="size" :height="size" decoding="async" draggable="false" />
  </picture>
</template>

<style scoped>
.weather-animation { display: inline-block; flex: none; max-width: 100%; aspect-ratio: 1; vertical-align: middle; }
.weather-animation img { display: block; width: 100%; height: 100%; object-fit: contain; }
</style>
