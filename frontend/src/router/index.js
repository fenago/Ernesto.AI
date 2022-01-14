// Packages
import Vue from 'vue'
import Router from 'vue-router'

// Store
import store from '../store'

// Utilities
import { layout } from '@/util/routes'
import { constants } from '@/util/constants'

Vue.use(Router)

const router = new Router({
  base: constants.BASE_URL,
  /**
   * learn about scrollBehavior here https://router.vuejs.org/guide/advanced/scroll-behavior.html#async-scrolling
   */

  scrollBehavior: (to, from, savedPosition) => {
    if (to.hash) return { selector: to.hash, behavior: 'smooth' }
    if (savedPosition) return savedPosition

    return { x: 0, y: 0 }
  },
  /**
   * requiresAuth is for a route where user is not allowed without logging in
   * guest is for a route where user can visit without logging in
   */
  routes: [
    /**
     * all routes that need to get rendered outside view (layout) should not be the children of layout('Default')
     * hence add them here
     */
    {
      path: '/login',
      name: 'Login',
      meta: { guest: true },
      component: () => import('../views/authentication/Login.vue'),
    },

    /**
     * following routes will get rendered inside view (layout)
     */
    layout('Default', [
      {
        path: '',
        name: 'Dashboard',
        meta: { requiresAuth: true },
        component: () => import('../views/Dashboard.vue'),
      },
      {
        path: '/job-search',
        name: 'Job Search',
        meta: { requiresAuth: true },
        component: () => import('../views/JobSearch.vue'),
      },
    ]),
  ],
})

// if token is not available, redirect user to login page
router.beforeEach((to, from, next) => {
  if (to.matched.every(record => !record.meta.requiresAuth)) {
    next()
    return
  }
  if (store.get('user/isAuthenticated')) {
    next()
    return
  }
  next('/login')
})

// if token is available, redirect user to home page
router.beforeEach((to, from, next) => {
  if (to.matched.every(record => !record.meta.guest)) {
    next()
    return
  }
  if (store.get('user/isAuthenticated')) {
    next('/')
    return
  }
  next()
})

export default router
