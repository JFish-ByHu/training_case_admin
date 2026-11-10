<script setup lang="ts">
/** 后台主布局，协调导航状态、移动端菜单、页面标题和退出登录。 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout } from '@/api/auth'
import { useAuthStore } from '@/stores'
import HeaderBar from './components/HeaderBar.vue'
import Sidebar from './components/Sidebar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(false)
const mobileMenuOpen = ref(false)
const signingOut = ref(false)
const pageTitle = computed(() => String(route.meta.title ?? '控制台'))

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const openMobileMenu = () => {
  mobileMenuOpen.value = true
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

/** 请求服务端退出并始终清理本地凭据后跳转登录页。 */
const signOut = async () => {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await logout()
  } catch {
    // 服务端退出失败时仍清除本地登录状态。
  } finally {
    authStore.removeToken()
    await router.replace('/login')
    signingOut.value = false
  }
}
</script>

<template>
  <div class="admin-layout" :class="{ 'is-collapsed': collapsed }">
    <aside class="desktop-sidebar">
      <Sidebar :collapsed="collapsed" />
    </aside>

    <ElDrawer v-model="mobileMenuOpen" class="mobile-nav-drawer" direction="ltr" size="232px" :with-header="false">
      <Sidebar @navigate="closeMobileMenu" />
    </ElDrawer>

    <div class="layout-body">
      <HeaderBar
        :title="pageTitle"
        :collapsed="collapsed"
        :signing-out="signingOut"
        @toggle-sidebar="toggleSidebar"
        @open-mobile-menu="openMobileMenu"
        @sign-out="signOut"
      />
      <main class="layout-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr);
  min-height: 100dvh;
  background: var(--el-bg-color-page);
  transition: grid-template-columns 280ms ease;
}

.admin-layout.is-collapsed {
  grid-template-columns: 64px minmax(0, 1fr);
}

.desktop-sidebar {
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid var(--el-border-color-light);
}

.layout-body {
  min-width: 0;
}

.layout-main {
  min-height: calc(100dvh - 64px);
  padding: 24px 24px 48px;
}

@media (max-width: 768px) {
  .admin-layout,
  .admin-layout.is-collapsed {
    display: block;
  }

  .desktop-sidebar {
    display: none;
  }

  .layout-main {
    padding: 24px 16px 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-layout { transition: none; }
}
</style>

<style>
.mobile-nav-drawer .el-drawer__body {
  padding: 0;
}
</style>
