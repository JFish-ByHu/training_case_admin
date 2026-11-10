<script setup lang="ts" generic="Model extends object">
import { useId } from 'vue'
import type { DatePickerProps, SelectProps } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import type { FilterField } from './types'

const props = withDefaults(defineProps<{
  fields: FilterField<Model>[]
  loading?: boolean
}>(), { loading: false })
const model = defineModel<Model>({ required: true })
/** 搜索和重置事件都返回独立拷贝，避免调用方修改筛选表单引用。 */
const emit = defineEmits<{ search: [value: Model]; reset: [value: Model] }>()
const formId = useId()

/** 更新单个筛选字段，同时保留筛选模型的其他字段。 */
const updateField = (field: FilterField<Model>, value: unknown) => {
  model.value = { ...model.value, [field.prop]: value }
}

const fieldWidth = (field: FilterField<Model>) => {
  const width = field.width ?? (field.type === 'datetimepicker' ? 240 : 220)
  return typeof width === 'number' ? `${width}px` : width
}

/** 复制日期和数组字段，隔离表单编辑值与提交值。 */
const copyModel = (value: Model): Model => {
  // 日期及多选数组单独复制，避免搜索条件与正在编辑的表单共享引用。
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copyValue(item)])) as Model
}

const copyValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(copyValue)
  if (value instanceof Date) return new Date(value)
  return value
}

/** 提交当前筛选条件的副本。 */
const search = () => {
  if (!props.loading) emit('search', copyModel(model.value))
}

/** 清空各类控件并恢复字段默认值，然后发出重置事件。 */
const reset = () => {
  if (props.loading) return
  const value = { ...model.value }
  for (const field of props.fields) {
    const empty = field.type === 'input' ? '' : field.type === 'select' ? (field.props?.multiple ? [] : '') : null
    Object.assign(value, { [field.prop]: copyValue(field.defaultValue !== undefined ? field.defaultValue : empty) })
  }
  model.value = value
  emit('reset', copyModel(value))
}

const searchOnEnter = (event: KeyboardEvent | Event) => {
  if (event instanceof KeyboardEvent && !event.isComposing && !event.repeat) {
    event.preventDefault()
    search()
  }
}

const dateInputId = (field: FilterField<Model>): string | [string, string] => {
  const id = `${formId}-${field.prop}`
  const type = field.type === 'datepicker' || field.type === 'datetimepicker' ? field.props?.type : ''
  return type?.endsWith('range') ? [id, `${id}-end`] : id
}

/** 暴露搜索与重置命令，供父组件按需调用。 */
defineExpose({ search, reset })
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <form class="filter" aria-label="筛选条件" @submit.prevent="search">
      <div v-for="field in fields" :key="field.prop" class="filter-field" :style="{ '--field-width': fieldWidth(field) }">
        <label :for="`${formId}-${field.prop}`">{{ field.label }}</label>
        <ElInput
          v-if="field.type === 'input'"
          clearable
          :placeholder="`请输入${field.label}`"
          v-bind="field.props"
          :id="`${formId}-${field.prop}`"
          :aria-label="field.label"
          :model-value="model[field.prop] == null ? '' : String(model[field.prop])"
          @update:model-value="updateField(field, $event)"
          @keydown.enter="searchOnEnter"
        />
        <ElSelect
          v-else-if="field.type === 'select'"
          clearable
          :placeholder="`请选择${field.label}`"
          :value-on-clear="field.props?.multiple ? undefined : ''"
          v-bind="field.props"
          :id="`${formId}-${field.prop}`"
          :aria-label="field.label"
          :model-value="model[field.prop] as SelectProps['modelValue']"
          @update:model-value="updateField(field, $event)"
        >
          <ElOption v-for="option in field.options" :key="String(option.value)" v-bind="option" />
        </ElSelect>
        <ElDatePicker
          v-else
          clearable
          :type="field.type === 'datetimepicker' ? 'datetime' : 'date'"
          :value-format="field.type === 'datetimepicker' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'"
          :placeholder="`请选择${field.label}`"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          range-separator="至"
          v-bind="field.props"
          :id="dateInputId(field)"
          :aria-label="field.label"
          :model-value="model[field.prop] as DatePickerProps['modelValue']"
          @update:model-value="updateField(field, $event)"
        />
      </div>
      <div class="filter-actions">
        <ElButton type="primary" native-type="submit" :icon="Search" :loading="loading">搜索</ElButton>
        <ElButton :icon="Refresh" :disabled="loading" @click="reset">重置</ElButton>
        <slot name="actions" />
      </div>
    </form>
  </ElConfigProvider>
</template>

<style scoped>
.filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
}
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 0 1 var(--field-width);
  width: var(--field-width);
  min-width: 0;
  max-width: 100%;
}
.filter-field label { color: var(--el-text-color-regular); font-size: 14px; }
.filter-field :deep(.el-date-editor) { width: 100%; min-width: 0; }
.filter-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.filter-actions :deep(.el-button + .el-button) { margin-left: 0; }
@media (max-width: 720px) {
  .filter-field { flex-basis: 100%; width: 100%; }
}
</style>
