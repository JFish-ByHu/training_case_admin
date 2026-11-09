import { defineStore } from 'pinia'

const TOKEN_KEY = 'demo_admin_access_token'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem(TOKEN_KEY) as string | null
  }),
  actions: {
    setToken(token: string) {
      sessionStorage.setItem(TOKEN_KEY, token)
      this.token = token
    },
    removeToken() {
      sessionStorage.removeItem(TOKEN_KEY)
      this.token = null
    }
  }
})
