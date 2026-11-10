import { defineStore } from 'pinia'
import { decryptPassword, encryptPassword } from './credentialCipher'

const TOKEN_KEY = 'demo_admin_access_token'
const USER_KEY = 'demo_admin_current_user'
const REMEMBER_KEY = 'demo_admin_remembered_credentials'

export interface AuthUser {
  id: string
  username: string
  nickname: string
  role: 'ADMIN' | 'USER'
}

function restoreCurrentUser(): AuthUser | null {
  try {
    const value = sessionStorage.getItem(USER_KEY)
    if (!value) return null
    const user: unknown = JSON.parse(value)
    if (typeof user === 'object' && user !== null &&
      'id' in user && typeof user.id === 'string' &&
      'username' in user && typeof user.username === 'string' &&
      'nickname' in user && typeof user.nickname === 'string' &&
      'role' in user && (user.role === 'ADMIN' || user.role === 'USER')) {
      return user as AuthUser
    }
  } catch {
    // 无效的本地缓存不影响重新获取用户信息。
  }
  sessionStorage.removeItem(USER_KEY)
  return null
}

interface StoredCredentials {
  username: string
  iv: string
  ciphertext: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem(TOKEN_KEY) as string | null,
    user: restoreCurrentUser(),
    rememberMe: Boolean(localStorage.getItem(REMEMBER_KEY))
  }),
  actions: {
    setToken(token: string) {
      sessionStorage.setItem(TOKEN_KEY, token)
      this.token = token
    },
    setUser(user: AuthUser) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
      this.user = user
    },
    removeToken() {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_KEY)
      this.token = null
      this.user = null
    },
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
    async saveRememberedCredentials(username: string, password: string) {
      const encrypted = await encryptPassword(password)
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username, ...encrypted }))
      this.rememberMe = true
    },
    clearRememberedCredentials() {
      localStorage.removeItem(REMEMBER_KEY)
      this.rememberMe = false
    }
  }
})
