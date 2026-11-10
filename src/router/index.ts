import { createRouter, createWebHistory } from 'vue-router'
import { pinia, useAuthStore } from '@/stores'
import { readCurrentUser } from '@/api/users'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layout/index.vue'),
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '控制台' }
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/index.vue'),
          meta: { title: '用户管理', requiresAdmin: true }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue')
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

router.beforeEach(async to => {
  const authStore = useAuthStore(pinia)
  const loggedIn = Boolean(authStore.token)
  if (to.matched.some(record => record.meta.requiresAuth) && !loggedIn) return { name: 'login' }
  if (to.name === 'login' && loggedIn) return { name: 'dashboard' }
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!authStore.user) {
      try {
        authStore.setUser(await readCurrentUser())
      } catch {
        return { name: authStore.token ? 'dashboard' : 'login' }
      }
    }
    if (authStore.user?.role !== 'ADMIN') return { name: 'dashboard' }
  }
})

export default router
