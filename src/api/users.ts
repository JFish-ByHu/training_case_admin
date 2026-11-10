import request from '@/utils/request'

/** 用户账号可用角色，与后端枚举值保持一致。 */
export type UserRole = 'ADMIN' | 'USER'
/** 用户账号状态，与后端枚举值保持一致。 */
export type UserStatus = 'ENABLED' | 'DISABLED'

/** 用户管理接口返回的账号资料，不包含密码信息。 */
export interface UserRecord {
  id: string
  username: string
  nickname: string
  phone: string | null
  bio: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
}

/** 用户分页查询条件；keyword 可匹配用户名或昵称。 */
export interface UserQuery {
  page: number
  pageSize: number
  keyword?: string
  status?: UserStatus
}

/** 用户分页接口返回结构。 */
export interface UserPage {
  records: UserRecord[]
  total: number
  page: number
  pageSize: number
}

/** 管理员创建普通用户时提交的资料及初始密码。 */
export interface CreateUserInput {
  username: string
  password: string
  nickname: string
  phone: string
  bio: string
  role: UserRole
  status: UserStatus
}

/** 管理员更新用户时提交的资料；密码为空时不修改密码。 */
export interface UpdateUserInput {
  id: string
  password?: string
  nickname: string
  phone: string
  bio: string
  role: UserRole
  status: UserStatus
}

/**
 * 分页查询用户列表，可附带关键字及状态筛选。
 * @param query 页码、分页大小及可选筛选条件。
 * @returns 当前页用户记录及分页统计。
 */
export const listUsers = (query: UserQuery) =>
  request.get<UserPage>('/users/list', { params: query })

/**
 * 根据用户 ID 获取账号详情。
 * @param id 用户 ID。
 * @returns 用户资料。
 */
export const readUser = (id: string) => request.get<UserRecord>('/users/detail', { params: { id } })

/**
 * 获取当前登录用户的资料。
 * @returns 当前用户资料。
 */
export const readCurrentUser = () => request.get<UserRecord>('/users/me')

/**
 * 创建用户并返回服务端保存后的用户资料。
 * @param input 新用户资料和初始密码。
 * @returns 已创建的用户资料。
 */
export const createUser = (input: CreateUserInput) =>
  request.post<UserRecord>('/users/create', input)

/**
 * 更新用户资料、账号角色/状态及可选的新密码。
 * @param input 用户 ID 和需要提交的更新字段。
 * @returns 更新后的用户资料。
 */
export const updateUser = (input: UpdateUserInput) =>
  request.patch<UserRecord>('/users/update', input)

/**
 * 删除指定用户账号。
 * @param id 待删除用户 ID。
 * @returns 成功时返回空数据。
 */
export const deleteUser = (id: string) => request.delete<null>('/users/delete', { data: { id } })

/**
 * 批量删除指定 ID 的用户；当前登录管理员不能包含在 ID 列表中。
 * @param ids 待删除用户 ID 列表，最多 100 个。
 * @returns 成功时返回空数据。
 */
export const batchDeleteUsers = (ids: string[]) =>
  request.delete<null>('/users/batchDelete', { data: { ids } })
