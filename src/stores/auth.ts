import { defineStore } from 'pinia'
import { decryptPassword, encryptPassword } from './credentialCipher'

const TOKEN_KEY = 'demo_admin_access_token'
const USER_KEY = 'demo_admin_current_user'
const REMEMBER_KEY = 'demo_admin_remembered_credentials'

/** 登录用户在前端持有的最小身份信息。 */
export interface AuthUser {
  id: string
  username: string
  nickname: string
  role: 'ADMIN' | 'USER'
}

/** 从本地存储恢复用户资料，兼容旧会话缓存并校验数据结构。 */
const restoreCurrentUser = (): AuthUser | null => {
  try {
    const value = sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY)
    if (!value) return null
    const user: unknown = JSON.parse(value)
    if (typeof user === 'object' && user !== null &&
      'id' in user && typeof user.id === 'string' &&
      'username' in user && typeof user.username === 'string' &&
      'nickname' in user && typeof user.nickname === 'string' &&
      'role' in user && (user.role === 'ADMIN' || user.role === 'USER')) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      sessionStorage.removeItem(USER_KEY)
      return user as AuthUser
    }
  } catch {
    // 无效的本地缓存不影响重新获取用户信息。
  }
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(USER_KEY)
  return null
}

interface StoredCredentials {
  username: string
  iv: string
  ciphertext: string
}

/** 管理访问令牌、当前用户和加密保存的记住我凭据。 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem(TOKEN_KEY) as string | null,
    user: restoreCurrentUser(),
    rememberMe: Boolean(localStorage.getItem(REMEMBER_KEY))
  }),
  actions: {
    /** 保存访问令牌至当前会话存储。 */
    setToken(token: string) {
      sessionStorage.setItem(TOKEN_KEY, token)
      this.token = token
    },
    /** 更新 Pinia 中的用户资料，并同步到本地存储。 */
    setUser(user: AuthUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      sessionStorage.removeItem(USER_KEY)
      this.user = user
    },
    /** 清除访问令牌和用户会话信息。 */
    removeToken() {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      localStorage.removeItem(USER_KEY)
      this.token = null
      this.user = null
    },
    /** 解密读取记住我凭据；存储内容无效时自动清理。 */
    async restoreRememberedCredentials() {
      const stored = localStorage.getItem(REMEMBER_KEY)
      if (!stored) {
        this.rememberMe = false
        return null
      }
      try {
        const credentials = JSON.parse(stored) as StoredCredentials
        if (
          typeof credentials.username !== 'string' ||
          typeof credentials.iv !== 'string' ||
          typeof credentials.ciphertext !== 'string'
        ) {
          throw new Error('Invalid remembered credentials')
        }
        const password = await decryptPassword(credentials.iv, credentials.ciphertext)
        if (localStorage.getItem(REMEMBER_KEY) !== stored) return null
        this.rememberMe = true
        return { username: credentials.username, password }
      } catch {
        if (localStorage.getItem(REMEMBER_KEY) === stored) this.clearRememberedCredentials()
        return null
      }
    },
    /** 加密后保存记住我凭据，不将密码明文写入本地存储。 */
    async saveRememberedCredentials(username: string, password: string) {
      const encrypted = await encryptPassword(password)
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, ...encrypted }))
      this.rememberMe = true
    },
    /** 删除已保存的记住我凭据并关闭记住我状态。 */
    clearRememberedCredentials() {
      localStorage.removeItem(REMEMBER_KEY)
      this.rememberMe = false
    }
  }
})
