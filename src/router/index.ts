import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layout/index.vue'),
      redirect: '/dashboard',
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
          meta: { title: '用户管理' }
        }
      ]
    },
    { path: '/login', redirect: '/dashboard' },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

export default router
