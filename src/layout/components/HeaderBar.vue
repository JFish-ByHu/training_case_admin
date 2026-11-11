<script setup lang="ts">
/** 顶部栏组件契约：接收标题和状态，通过事件请求布局执行菜单及退出操作。 */
import { ArrowDown, Expand, Fold, Menu, UserFilled } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()
/** 昵称随 Pinia 用户资料更新，缺省时使用登录用户名。 */
const accountName = computed(() => authStore.user?.nickname || authStore.user?.username || '我的账号')

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

const selectAccountAction = (command: string) => {
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
      <ElButton class="account-button" text :aria-label="`${accountName}的账号菜单`" :title="accountName">
        <ElIcon :size="18"><UserFilled /></ElIcon>
        <span class="account-name">{{ accountName }}</span>
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
  flex-shrink: 0;
  height: 40px;
  color: var(--el-text-color-regular);
}

.account-name {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

  .account-name {
    max-width: 80px;
  }
}
</style>
