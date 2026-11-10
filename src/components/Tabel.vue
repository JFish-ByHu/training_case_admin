<script setup lang="ts" generic="Row extends object">
import { computed, ref, watch } from 'vue'
import type { TableInstance, TableProps } from 'element-plus'
import { Delete, Edit, MoreFilled, View } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import type { PageChange, TabelAction, TabelActionColumn, TabelColumn } from './types'

defineOptions({ inheritAttrs: false })

/**
 * 通用数据表格。
 * 默认启用边框、溢出提示和分页；分页可由服务端或当前页数据驱动。
 * action、selection-change 和 page-change 事件用于将用户操作交回调用方。
 */
const props = withDefaults(defineProps<{
  data: Row[]
  columns: TabelColumn<Row>[]
  border?: boolean
  selection?: boolean
  reserveSelection?: boolean
  selectable?: (row: Row, index: number) => boolean
  rowKey?: TableProps<Row>['rowKey']
  loading?: boolean
  lazy?: boolean
  load?: TableProps<Row>['load']
  treeProps?: TableProps<Row>['treeProps']
  showOverflowTooltip?: boolean
  pagination?: boolean
  paginationMode?: 'server' | 'client'
  total?: number
  pageSizes?: number[]
  showActions?: boolean
  actions?: TabelAction<Row>[]
  actionColumn?: TabelActionColumn
}>(), {
  border: true,
  selection: false,
  reserveSelection: false,
  rowKey: 'id',
  loading: false,
  lazy: false,
  showOverflowTooltip: true,
  pagination: true,
  paginationMode: 'server',
  pageSizes: () => [10, 20, 50, 100],
  showActions: true,
  actions: () => [{ key: 'edit' }, { key: 'delete' }, { key: 'detail' }],
  actionColumn: () => ({})
})

const currentPage = defineModel<number>('currentPage', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })
const emit = defineEmits<{
  'page-change': [page: PageChange]
  'selection-change': [rows: Row[]]
  action: [key: string, row: Row, index: number]
}>()
const defaultActions: Record<string, TabelAction<Row>> = {
  edit: { key: 'edit', label: '编辑', icon: Edit, type: 'primary' },
  delete: { key: 'delete', label: '删除', icon: Delete, type: 'danger' },
  detail: { key: 'detail', label: '详情', icon: View, type: 'primary' }
}
const resolvedActions = computed(() => props.actions.map(action => ({
  label: action.key,
  type: 'primary' as const,
  ...defaultActions[action.key],
  ...action
})))

/** 按行配置过滤不可见操作项。 */
const visibleActions = (row: Row) => {
  return resolvedActions.value.filter(action => !(typeof action.hidden === 'function' ? action.hidden(row) : action.hidden))
}

/** 合并加载状态与操作项自身的禁用条件。 */
const isActionDisabled = (action: TabelAction<Row>, row: Row) => {
  return props.loading || (typeof action.disabled === 'function' ? action.disabled(row) : action.disabled)
}

/** 触发可用操作并向调用方发出操作键和行数据。 */
const triggerAction = (action: TabelAction<Row>, row: Row, index: number) => {
  if (!isActionDisabled(action, row)) emit('action', action.key, row, index)
}
const tableRef = ref<TableInstance>()
const totalRows = computed(() => props.paginationMode === 'client' ? props.data.length : (props.total ?? props.data.length))
const visibleRows = computed(() => {
  if (!props.pagination || props.paginationMode === 'server') return props.data
  const start = (currentPage.value - 1) * pageSize.value
  return props.data.slice(start, start + pageSize.value)
})

const changePage = (page: number) => {
  if (page === currentPage.value) return
  currentPage.value = page
  emit('page-change', { currentPage: page, pageSize: pageSize.value })
}

const changePageSize = (size: number) => {
  if (size === pageSize.value) return
  pageSize.value = size
  currentPage.value = 1
  emit('page-change', { currentPage: 1, pageSize: size })
}

watch([totalRows, pageSize], () => {
  if (props.pagination && props.paginationMode === 'client') {
    const lastPage = Math.max(1, Math.ceil(totalRows.value / pageSize.value))
    if (currentPage.value > lastPage) changePage(lastPage)
  }
})

/** 暴露 Element Plus 表格选择及布局方法，供父组件批量操作使用。 */
defineExpose({
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row: Row, selected?: boolean) => tableRef.value?.toggleRowSelection(row, selected),
  getSelectionRows: () => tableRef.value?.getSelectionRows() as Row[] | undefined,
  doLayout: () => tableRef.value?.doLayout()
})
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <div class="tabel">
      <ElTable
        ref="tableRef"
        v-loading="loading"
        v-bind="$attrs"
        :data="visibleRows"
        :border="border"
        :row-key="rowKey"
        :lazy="lazy"
        :load="load"
        :tree-props="treeProps"
        :show-overflow-tooltip="showOverflowTooltip"
        @selection-change="emit('selection-change', $event)"
      >
        <ElTableColumn
          v-if="selection"
          type="selection"
          width="48"
          fixed="left"
          align="center"
          :reserve-selection="reserveSelection"
          :selectable="selectable"
        />
        <ElTableColumn
          v-for="column in columns"
          :key="column.prop"
          v-bind="column"
          :min-width="column.minWidth ?? 120"
          :show-overflow-tooltip="column.showOverflowTooltip ?? showOverflowTooltip"
        >
          <template #default="scope">
            <slot :name="column.slot ?? column.prop" :row="scope.row" :column="scope.column" :index="scope.$index">
              {{ column.formatter ? column.formatter(scope.row, scope.column, scope.row[column.prop], scope.$index) : (scope.row[column.prop] ?? '—') }}
            </slot>
          </template>
        </ElTableColumn>
        <slot />
        <ElTableColumn
          v-if="showActions"
          :label="actionColumn.label ?? '操作'"
          :width="actionColumn.width ?? 140"
          :fixed="actionColumn.fixed ?? false"
          :show-overflow-tooltip="false"
          align="center"
        >
          <template #default="{ row, $index }">
            <slot name="actions" :row="row" :index="$index">
              <div class="tabel-actions">
                <ElTooltip
                  v-for="action in visibleActions(row)"
                  :key="action.key"
                  :content="action.label"
                  placement="top"
                >
                  <span class="tabel-action">
                    <ElButton
                      link
                      :type="action.type"
                      :icon="action.icon ?? MoreFilled"
                      :aria-label="action.label"
                      :disabled="isActionDisabled(action, row)"
                      @click.stop="triggerAction(action, row, $index)"
                    />
                  </span>
                </ElTooltip>
              </div>
            </slot>
          </template>
        </ElTableColumn>
        <template v-if="$slots.empty" #empty><slot name="empty" /></template>
        <template v-if="$slots.append" #append><slot name="append" /></template>
      </ElTable>
      <ElPagination
        v-if="pagination"
        class="tabel-pagination"
        background
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        :total="totalRows"
        :pager-count="5"
        :disabled="loading"
        layout="total, sizes, prev, pager, next, jumper"
        @update:current-page="changePage"
        @update:page-size="changePageSize"
      />
    </div>
  </ElConfigProvider>
</template>

<style scoped>
.tabel {
  width: 100%;
  min-width: 0;
}

.tabel-pagination {
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.tabel-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.tabel-actions :deep(.el-button + .el-button) { margin-left: 0; }

.tabel-action { display: inline-flex; }
.tabel-action :deep(.el-button) { min-width: 28px; min-height: 28px; }

@media (max-width: 720px) {
  .tabel-pagination { justify-content: flex-start; }
  .tabel-pagination :deep(.el-pagination__jump) { display: none; }
  .tabel-pagination::before { content: ''; flex-basis: 100%; order: 1; }
  .tabel-pagination :deep(.btn-prev),
  .tabel-pagination :deep(.el-pager),
  .tabel-pagination :deep(.btn-next) { order: 2; }
}
</style>
