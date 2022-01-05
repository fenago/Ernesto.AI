// Imports
import Vue from 'vue'
import Router from 'vue-router'
import { layout } from '@/util/routes'

Vue.use(Router)

const router = new Router({
  base: process.env.BASE_URL,
  scrollBehavior: (to, from, savedPosition) => {
    if (to.hash) return { selector: to.hash }
    if (savedPosition) return savedPosition

    return { x: 0, y: 0 }
  },
  routes: [
    /**
     * all routes that need to get rendered outside view (layout) should not be the children of layout('Default')
     */

    /**
     * following routes will get rendered inside view (layout)
     */
    layout('Default', [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
      },
    ]),
  ],
})

export default router
