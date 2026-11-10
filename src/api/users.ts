import request from '@/utils/request'

export type UserRole = 'ADMIN' | 'USER'
export type UserStatus = 'ENABLED' | 'DISABLED'

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

export interface UserQuery {
  page: number
  pageSize: number
  keyword?: string
  status?: UserStatus
}

export interface UserPage {
  records: UserRecord[]
  total: number
  page: number
  pageSize: number
}

export interface CreateUserInput {
  username: string
  password: string
  nickname: string
  phone: string
  bio: string
  role: UserRole
  status: UserStatus
}

export interface UpdateUserInput {
  id: string
  password?: string
  nickname: string
  phone: string
  bio: string
  role: UserRole
  status: UserStatus
}

export function listUsers(query: UserQuery) {
  return request.get<UserPage>('/users/list', { params: query })
}

export function readUser(id: string) {
  return request.get<UserRecord>('/users/detail', { params: { id } })
}

export function readCurrentUser() {
  return request.get<UserRecord>('/users/me')
}

export function createUser(input: CreateUserInput) {
  return request.post<UserRecord>('/users/create', input)
}

export function updateUser(input: UpdateUserInput) {
  return request.patch<UserRecord>('/users/update', input)
}

export function deleteUser(id: string) {
  return request.delete<null>('/users/delete', { data: { id } })
}

export function batchDeleteUsers(ids: string[]) {
  return request.delete<null>('/users/batchDelete', { data: { ids } })
}
