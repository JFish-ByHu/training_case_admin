<script setup lang="ts">
import { Expand, Fold, Menu } from '@element-plus/icons-vue'
defineProps<{
  title: string
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
  openMobileMenu: []
}>()
</script>

<template>
  <header class="header-bar">
    <div class="header-left">
      <ElButton
        class="desktop-menu-button"
        :icon="collapsed ? Expand : Fold"
        text
        aria-label="切换侧边栏"
        title="切换侧边栏"
        @click="emit('toggleSidebar')"
      />
      <ElButton
        class="mobile-menu-button"
        :icon="Menu"
        text
        aria-label="打开菜单"
        title="打开菜单"
        @click="emit('openMobileMenu')"
      />
      <ElBreadcrumb separator="/">
        <ElBreadcrumbItem :to="{ name: 'dashboard' }">工作台</ElBreadcrumbItem>
        <ElBreadcrumbItem v-if="title !== '控制台'">{{ title }}</ElBreadcrumbItem>
      </ElBreadcrumb>
    </div>
  </header>
</template>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  min-height: 64px;
  padding: 0 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.header-left :deep(.el-button) {
  width: 40px;
  height: 40px;
  margin: 0;
  font-size: 19px;
}

.mobile-menu-button {
  display: none;
}

@media (max-width: 768px) {
  .header-bar {
    padding: 0 12px;
  }

  .desktop-menu-button {
    display: none;
  }

  .mobile-menu-button {
    display: inline-flex;
  }
}
</style>
