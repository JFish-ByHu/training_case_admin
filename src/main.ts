/** 创建 Vue 应用并注册全局状态、路由及 Element Plus 主题样式。 */
import { createApp } from 'vue'
import { pinia } from './stores'

import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/base.css'

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
