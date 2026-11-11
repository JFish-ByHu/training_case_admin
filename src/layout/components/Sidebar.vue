<script setup lang="ts">
/** 按当前路由和用户角色呈现导航菜单，并在导航后通知布局收起移动菜单。 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DataAnalysis, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores'

defineProps<{ collapsed?: boolean }>()
const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()
const authStore = useAuthStore()
const activeMenu = computed(() => (route.path.startsWith('/users') ? '/users' : '/dashboard'))

const selectMenu = () => {
  emit('navigate')
}
</script>

<template>
  <div class="sidebar" :class="{ 'is-collapsed': collapsed }">
    <RouterLink class="brand" to="/dashboard" aria-label="Admin Demo 控制台" @click="selectMenu">
      <span class="brand-name">Admin<span class="brand-suffix" :aria-hidden="collapsed">&nbsp;Demo</span></span>
    </RouterLink>

    <nav aria-label="主导航">
      <ElMenu :default-active="activeMenu" router @select="selectMenu">
        <ElMenuItem index="/dashboard" :title="collapsed ? '控制台' : undefined">
          <ElIcon><DataAnalysis /></ElIcon>
          <span class="menu-label" :aria-hidden="collapsed">控制台</span>
        </ElMenuItem>
        <ElMenuItem v-if="authStore.user?.role === 'ADMIN'" index="/users" :title="collapsed ? '用户管理' : undefined">
          <ElIcon><User /></ElIcon>
          <span class="menu-label" :aria-hidden="collapsed">用户管理</span>
        </ElMenuItem>
      </ElMenu>
    </nav>
  </div>
</template>

<style scoped>
.sidebar {
  width: 100%;
  min-height: 100%;
  background: var(--el-bg-color);
  --el-menu-base-level-padding: 12px;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  padding: 0 8px;
  overflow: hidden;
  border-bottom: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-primary);
  text-decoration: none;
  white-space: nowrap;
}

.brand-name {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 700;
}

/* 仅收起后缀，保留 Admin，并与侧栏宽度使用相同的过渡时长。 */
.brand-suffix {
  overflow: hidden;
  max-width: 60px;
  opacity: 1;
  transition: max-width 280ms ease, opacity 180ms ease;
}

.sidebar.is-collapsed .brand-suffix {
  max-width: 0;
  opacity: 0;
}

:deep(.el-menu) {
  width: 100%;
  border-right: none;
  padding: 12px 8px;
}

:deep(.el-menu-item) {
  height: 42px;
  margin-bottom: 4px;
  border-radius: 6px;
  color: var(--el-text-color-regular);
}

:deep(.el-menu-item .el-icon) {
  width: 24px;
  margin-right: 8px;
  transition: margin-right 280ms ease;
}

.menu-label {
  display: inline-block;
  overflow: hidden;
  max-width: 120px;
  white-space: nowrap;
  opacity: 1;
  transition: max-width 280ms ease, opacity 180ms ease;
}

.sidebar.is-collapsed :deep(.el-menu-item .el-icon) { margin-right: 0; }
.sidebar.is-collapsed .menu-label {
  max-width: 0;
  opacity: 0;
}

:deep(.el-menu-item:hover) {
  background: var(--el-fill-color-light);
}

:deep(.el-menu-item.is-active) {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .brand-suffix,
  .menu-label,
  :deep(.el-menu-item .el-icon) { transition: none; }
}
</style>
