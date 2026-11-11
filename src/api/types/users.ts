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
