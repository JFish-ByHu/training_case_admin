import request from '@/utils/request'
import type { CreateUserInput, UpdateUserInput, UserPage, UserQuery, UserRecord } from './types/users'

/** 分页查询用户，可按关键字及状态筛选。 */
export const listUsers = (query: UserQuery) =>
  request.get<UserPage>('/users/list', { params: query })

/** 根据 ID 查询用户详情。 */
export const readUser = (id: string) => request.get<UserRecord>('/users/detail', { params: { id } })

/** 创建用户并返回保存后的资料。 */
export const createUser = (input: CreateUserInput) =>
  request.post<UserRecord>('/users/create', input)

/** 更新用户并返回保存后的资料。 */
export const updateUser = (input: UpdateUserInput) =>
  request.patch<UserRecord>('/users/update', input)

/** 删除指定用户。 */
export const deleteUser = (id: string) => request.delete<null>('/users/delete', { data: { id } })

/** 批量删除指定用户，一次最多 100 个。 */
export const batchDeleteUsers = (ids: string[]) =>
  request.delete<null>('/users/batchDelete', { data: { ids } })
