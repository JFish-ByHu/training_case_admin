<script setup lang="ts">
/**
 * 用户管理页面：负责筛选、分页、详情查看和单条/批量管理操作。
 * 数据请求及用户资料模型由 api/users 封装，与通用 Filter、Tabel 组件协作。
 */
import { computed, onMounted, ref } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  batchDeleteUsers, deleteUser, listUsers, readCurrentUser, readUser,
  type UserRecord, type UserStatus
} from '@/api/users'
import { Filter, Tabel, type FilterField, type TabelAction, type TabelColumn } from '@/components/index'
import UserFormDialog from './components/UserFormDialog.vue'
import { useAuthStore } from '@/stores'

interface UserFilter {
  keyword: string
  status: UserStatus | ''
}

const filterModel = ref<UserFilter>({ keyword: '', status: '' })
const authStore = useAuthStore()
const appliedFilter = ref<UserFilter>({ keyword: '', status: '' })
const currentPage = ref(1)
const pageSize = ref(10)
const users = ref<UserRecord[]>([])
const total = ref(0)
const loading = ref(false)
const mutating = ref(false)
const openingUserId = ref<string | null>(null)
const currentUserId = ref<string | null>(null)
const selectedUsers = ref<UserRecord[]>([])
const tableRef = ref<{ clearSelection: () => void }>()
const formVisible = ref(false)
const editingUser = ref<UserRecord | null>(null)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailUser = ref<UserRecord | null>(null)
let listRequestId = 0

const fields: FilterField<UserFilter>[] = [
  { prop: 'keyword', label: '用户名或昵称', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { label: '启用', value: 'ENABLED' },
    { label: '停用', value: 'DISABLED' }
  ] }
]

const columns: TabelColumn<UserRecord>[] = [
  { prop: 'username', label: '用户名', minWidth: 160, fixed: 'left' },
  { prop: 'nickname', label: '昵称', minWidth: 160 },
  { prop: 'phone', label: '电话', minWidth: 150 },
  { prop: 'role', label: '角色', minWidth: 120 },
  { prop: 'status', label: '状态', minWidth: 110 },
  { prop: 'createdAt', label: '创建时间', minWidth: 180 }
]

const actions: TabelAction<UserRecord>[] = [
  { key: 'edit' },
  { key: 'delete', disabled: row => row.id === currentUserId.value },
  { key: 'detail' }
]
const selectedCount = computed(() => selectedUsers.value.length)

const formatDateTime = (value: string | null | undefined) => {
  return value ? value.replace('T', ' ').slice(0, 19) : '-'
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
  selectedUsers.value = []
}

/** 加载当前筛选和分页条件下的用户，并忽略过期请求结果。 */
const loadUsers = async () => {
  const requestId = ++listRequestId
  loading.value = true
  clearSelection()
  try {
    const result = await listUsers({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: appliedFilter.value.keyword.trim() || undefined,
      status: appliedFilter.value.status || undefined
    })
    if (requestId !== listRequestId) return
    if (result.total > 0 && result.records.length === 0 && currentPage.value > 1) {
      currentPage.value = Math.max(1, Math.ceil(result.total / pageSize.value))
      await loadUsers()
      return
    }
    users.value = result.records
    total.value = result.total
  } catch {
    if (requestId === listRequestId) {
      users.value = []
      total.value = 0
    }
  } finally {
    if (requestId === listRequestId) loading.value = false
  }
}

const loadCurrentUser = async () => {
  try {
    const user = await readCurrentUser()
    currentUserId.value = user.id
    authStore.setUser(user)
    if (selectedUsers.value.some(user => user.id === currentUserId.value)) clearSelection()
  } catch {
    // 请求器会报告认证错误；后端仍会拒绝非法的自我管理操作。
  }
}

const searchUsers = (value: UserFilter) => {
  appliedFilter.value = { ...value }
  currentPage.value = 1
  void loadUsers()
}

const resetUsers = (value: UserFilter) => {
  searchUsers(value)
}

const changeUserPage = () => {
  void loadUsers()
}

const openCreate = () => {
  editingUser.value = null
  formVisible.value = true
}

const openEdit = async (row: UserRecord) => {
  if (openingUserId.value) return
  openingUserId.value = row.id
  try {
    editingUser.value = await readUser(row.id)
    formVisible.value = true
  } catch {
    // 请求器已显示错误。
  } finally {
    openingUserId.value = null
  }
}

const openDetail = async (row: UserRecord) => {
  detailVisible.value = true
  detailLoading.value = true
  detailUser.value = null
  try {
    detailUser.value = await readUser(row.id)
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

/** 二次确认后删除指定用户；批量操作与单条删除共用此流程。 */
const confirmDeleteUsers = async (targets: UserRecord[], batch = false) => {
  if (mutating.value || !targets.length) return
  const ids = [...new Set(targets.map(user => user.id))]
  if (currentUserId.value && ids.includes(currentUserId.value)) return

  try {
    await ElMessageBox.confirm(
      batch ? `确定删除选中的 ${ids.length} 位用户吗？` : `确定删除用户「${targets[0]?.username}」吗？`,
      batch ? '批量删除' : '删除用户',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' }
    )
  } catch {
    return
  }

  mutating.value = true
  try {
    if (batch) await batchDeleteUsers(ids)
    else await deleteUser(ids[0]!)
    ElMessage.success(batch ? `已删除 ${ids.length} 位用户` : '用户已删除')
    await loadUsers()
  } catch {
    // 请求器已显示错误，保留当前列表。
  } finally {
    mutating.value = false
  }
}

const deleteSelectedUsers = () => {
  void confirmDeleteUsers(selectedUsers.value, true)
}

const selectUserAction = (key: string, row: UserRecord) => {
  if (key === 'edit') void openEdit(row)
  if (key === 'detail') void openDetail(row)
  if (key === 'delete') void confirmDeleteUsers([row])
}

const refreshAfterSave = () => {
  if (!editingUser.value) currentPage.value = 1
  void loadUsers()
}

onMounted(() => {
  void loadCurrentUser()
  void loadUsers()
})
</script>

<template>
  <section class="users-page">
    <Filter v-model="filterModel" :fields="fields" :loading="loading" @search="searchUsers" @reset="resetUsers" />

    <div class="table-toolbar">
      <ElButton type="primary" :icon="Plus" @click="openCreate">新增用户</ElButton>
      <ElButton type="danger" :icon="Delete" :disabled="!selectedCount || loading || mutating" @click="deleteSelectedUsers">
        批量删除{{ selectedCount ? ` (${selectedCount})` : '' }}
      </ElButton>
    </div>

    <Tabel
      ref="tableRef"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :data="users"
      :columns="columns"
      :total="total"
      :loading="loading"
      :page-sizes="[10, 20, 50, 100]"
      :selection="true"
      :selectable="row => row.id !== currentUserId"
      :actions="actions"
      :action-column="{ fixed: 'right' }"
      row-key="id"
      @page-change="changeUserPage"
      @selection-change="selectedUsers = $event"
      @action="selectUserAction"
    >
      <template #phone="{ row }">{{ row.phone || '-' }}</template>
      <template #role="{ row }">{{ row.role === 'ADMIN' ? '管理员' : '普通用户' }}</template>
      <template #status="{ row }">
        <ElTag :type="row.status === 'ENABLED' ? 'success' : 'info'" size="small">
          {{ row.status === 'ENABLED' ? '启用' : '停用' }}
        </ElTag>
      </template>
      <template #createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    </Tabel>

    <UserFormDialog v-model="formVisible" :user="editingUser" :current-user-id="currentUserId" @saved="refreshAfterSave" />

    <ElDrawer v-model="detailVisible" title="用户详情" size="min(480px, 100vw)">
      <div v-loading="detailLoading">
        <ElDescriptions v-if="detailUser" :column="1" border>
          <ElDescriptionsItem label="用户名">{{ detailUser.username }}</ElDescriptionsItem>
          <ElDescriptionsItem label="昵称">{{ detailUser.nickname }}</ElDescriptionsItem>
          <ElDescriptionsItem label="电话">{{ detailUser.phone || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="角色">{{ detailUser.role === 'ADMIN' ? '管理员' : '普通用户' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="状态">{{ detailUser.status === 'ENABLED' ? '启用' : '停用' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="简介">{{ detailUser.bio || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">{{ formatDateTime(detailUser.createdAt) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">{{ formatDateTime(detailUser.updatedAt) }}</ElDescriptionsItem>
        </ElDescriptions>
      </div>
    </ElDrawer>
  </section>
</template>

<style scoped>
.users-page { width: 100%; }
.table-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.table-toolbar :deep(.el-button + .el-button) { margin-left: 0; }
</style>
