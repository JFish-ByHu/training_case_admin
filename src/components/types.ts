import type { Component } from 'vue'
import type { ButtonProps, DatePickerProps, InputProps, SelectProps, TableColumnCtx } from 'element-plus'

export interface TabelAction<Row extends object = Record<string, unknown>> {
  key: string
  /** 内置 edit/delete/detail 可省略标签和图标；自定义项建议填写。 */
  label?: string
  icon?: Component
  type?: ButtonProps['type']
  disabled?: boolean | ((row: Row) => boolean)
  hidden?: boolean | ((row: Row) => boolean)
}

export interface TabelActionColumn {
  label?: string
  width?: string | number
  fixed?: boolean | 'left' | 'right'
}

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

export interface PageChange {
  currentPage: number
  pageSize: number
}

export interface FilterOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

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
