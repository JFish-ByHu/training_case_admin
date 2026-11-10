import type { Component } from 'vue'
import type { ButtonProps, DatePickerProps, InputProps, SelectProps, TableColumnCtx } from 'element-plus'

/** 表格操作列中的操作项；disabled/hidden 支持按当前行动态计算。 */
export interface TabelAction<Row extends object = Record<string, unknown>> {
  key: string
  /** 内置 edit/delete/detail 操作可省略标签和图标；自定义操作建议填写。 */
  label?: string
  icon?: Component
  type?: ButtonProps['type']
  disabled?: boolean | ((row: Row) => boolean)
  hidden?: boolean | ((row: Row) => boolean)
}

/** 操作列宽度、标题及固定位置配置。 */
export interface TabelActionColumn {
  label?: string
  width?: string | number
  fixed?: boolean | 'left' | 'right'
}

/** 表格数据列配置，支持自定义插槽、格式化及固定列。 */
export interface TabelColumn<Row extends object = Record<string, unknown>> {
  prop: Extract<keyof Row, string>
  label: string
  width?: string | number
  minWidth?: string | number
  fixed?: boolean | 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  sortable?: boolean | 'custom'
  showOverflowTooltip?: boolean
  slot?: string
  formatter?: (row: Row, column: TableColumnCtx<Row>, value: unknown, index: number) => string
}

/** 分页器变更事件携带的当前页和每页条数。 */
export interface PageChange {
  currentPage: number
  pageSize: number
}

/** 筛选下拉框的一项可选值。 */
export interface FilterOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

/** 筛选项定义；控件属性按 input、select 或日期选择器类型提供。 */
export type FilterField<Model extends object = Record<string, unknown>> = {
  prop: Extract<keyof Model, string>
  label: string
  width?: string | number
  defaultValue?: Model[keyof Model]
} & (
  | { type: 'input'; props?: Partial<Omit<InputProps, 'modelValue' | 'id'>> }
  | { type: 'select'; options: FilterOption[]; props?: Partial<Omit<SelectProps, 'modelValue' | 'id'>> }
  | { type: 'datepicker' | 'datetimepicker'; props?: Partial<Omit<DatePickerProps, 'modelValue' | 'id'>> }
)
