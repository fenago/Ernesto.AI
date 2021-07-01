// Imports
import Vue from 'vue'
import Router from 'vue-router'
import { trailingSlash } from '@/util/helpers'
import { layout } from '@/util/routes'
import store from '../store/index'

Vue.use(Router)

const router = new Router({
  base: process.env.BASE_URL,
  scrollBehavior: (to, from, savedPosition) => {
    if (to.hash) return { selector: to.hash }
    if (savedPosition) return savedPosition

    return { x: 0, y: 0 }
  },
  routes: [
    // all routes that need to get rendered outside view (layout) should not be the children of layout('Default')
    // authentication
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/authentication/Login.vue'),
    },

    // following routes will get rendered inside view (layout)
    layout('Default', [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../views/Dashboard.vue'),
      },
    ]),
  ],
})

router.beforeEach(async (to, from, next) => {
  if (store.getters['user/isSessionExpired']) {
    await store.dispatch('user/setSession')
  }
  if (to.path.includes('/login') && store.getters['user/isAuthenticated']) {
    return next(from.path)
  } else if (
    !to.path.includes('/login') &&
    !store.getters['user/isAuthenticated']
  ) {
    store.dispatch('user/clearSession')
    return next({ name: 'login' })
  }
  return to.path.endsWith('/') ? next() : next(trailingSlash(to.path))
})

export default router
