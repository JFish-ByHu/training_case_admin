<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DataAnalysis, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores'

defineProps<{ collapsed?: boolean }>()
const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()
const authStore = useAuthStore()
const activeMenu = computed(() => (route.path.startsWith('/users') ? '/users' : '/dashboard'))

function selectMenu() {
  emit('navigate')
}
</script>

<template>
  <div class="sidebar" :class="{ 'is-collapsed': collapsed }">
    <RouterLink class="brand" to="/dashboard" @click="selectMenu">
      <span class="brand-mark">A</span>
      <span class="brand-name" :aria-hidden="collapsed">Admin Demo</span>
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
  gap: 12px;
  height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-primary);
  text-decoration: none;
  white-space: nowrap;
}

.brand-mark {
  display: grid;
  flex: none;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 17px;
  font-weight: 700;
}

.brand-name {
  overflow: hidden;
  max-width: 140px;
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  opacity: 1;
  transition: max-width 280ms ease, opacity 180ms ease;
}

.sidebar.is-collapsed .brand-name {
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
  .brand-name,
  .menu-label,
  :deep(.el-menu-item .el-icon) { transition: none; }
}
</style>
