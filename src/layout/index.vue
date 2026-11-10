<script setup lang="ts">
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

function toggleSidebar() {
  collapsed.value = !collapsed.value
}

function openMobileMenu() {
  mobileMenuOpen.value = true
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

async function signOut() {
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
