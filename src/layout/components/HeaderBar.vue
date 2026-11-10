<script setup lang="ts">
import { ArrowDown, Expand, Fold, Menu, UserFilled } from '@element-plus/icons-vue'

defineProps<{
  title: string
  collapsed: boolean
  signingOut: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
  openMobileMenu: []
  signOut: []
}>()

function selectAccountAction(command: string) {
  if (command === 'logout') emit('signOut')
}
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

    <ElDropdown trigger="click" @command="selectAccountAction">
      <ElButton class="account-button" text aria-label="我的账号">
        <ElIcon :size="18"><UserFilled /></ElIcon>
        <span>我的账号</span>
        <ElIcon :size="14"><ArrowDown /></ElIcon>
      </ElButton>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem command="logout" :disabled="signingOut">退出登录</ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </header>
</template>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 0 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.header-left,
.account-button {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left {
  min-width: 0;
}

.header-left :deep(.el-button) {
  width: 40px;
  height: 40px;
  margin: 0;
  font-size: 19px;
}

.account-button {
  height: 40px;
  color: var(--el-text-color-regular);
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

  .account-button {
    gap: 6px;
  }

  .account-button span {
    display: none;
  }
}
</style>
