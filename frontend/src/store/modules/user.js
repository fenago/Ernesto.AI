// Utilities
import { make } from 'vuex-pathify'
import lodashIsEmpty from 'lodash/isEmpty'

// Globals
import { IN_BROWSER } from '@/util/globals'

// services
import axios from '@/util/axios'
import { constants } from '@/util/constants'

const state = {
  dark: false,
  drawer: {
    image: 0,
    gradient: 0,
    mini: false,
  },
  gradients: [
    'rgba(0, 0, 0, .7), rgba(0, 0, 0, .7)',
    'rgba(228, 226, 226, 1), rgba(255, 255, 255, 0.7)',
    'rgba(244, 67, 54, .8), rgba(244, 67, 54, .8)',
  ],
  images: [
    'https://demos.creative-tim.com/material-dashboard-pro/assets/img/sidebar-1.jpg',
    'https://demos.creative-tim.com/material-dashboard-pro/assets/img/sidebar-2.jpg',
    'https://demos.creative-tim.com/material-dashboard-pro/assets/img/sidebar-3.jpg',
    'https://demos.creative-tim.com/material-dashboard-pro/assets/img/sidebar-4.jpg',
  ],
  rtl: false,
  isAuthenticated: false,
}

const mutations = make.mutations(state)

const actions = {
  fetch: ({ commit }) => {
    const local = localStorage.getItem('vuetify@user') || '{}'
    const user = JSON.parse(local)

    for (const key in user) {
      commit(key, user[key])
    }

    if (user.dark === undefined) {
      commit('dark', window.matchMedia('(prefers-color-scheme: dark)'))
    }
  },
  update: ({ state }) => {
    if (!IN_BROWSER) return
    localStorage.setItem('vuetify@user', JSON.stringify(state))
  },
  setSession: async ({ commit, dispatch }) => {
    await axios
      .get('/userinfo')
      .then(res => {
        if (res.status === 200) {
          sessionStorage.setItem(
            constants.sessionStorageKeys.USER,
            JSON.stringify(res.data),
          )
          commit('isAuthenticated', true)
        }
      })
      .catch(err => {
        dispatch('clearSession')
        console.error(err, 'failed to get user info')
      })
  },
  clearSession: ({ commit }) => {
    sessionStorage.removeItem(constants.sessionStorageKeys.USER)
    commit('isAuthenticated', false)
  },
}

const getters = {
  dark: (state, getters) => {
    return state.dark || getters.gradient.indexOf('255, 255, 255') === -1
  },
  gradient: state => {
    return state.gradients[state.drawer.gradient]
  },
  image: state => {
    return state.drawer.image === ''
      ? state.drawer.image
      : state.images[state.drawer.image]
  },
  isAuthenticated: state => {
    if (!state.isAuthenticated) {
      const session =
        sessionStorage.getItem(constants.sessionStorageKeys.USER) || '{}'
      const user = JSON.parse(session)
      if (lodashIsEmpty(user)) {
        return false
      }
    }
    return true
  },
  isSessionExpired: () => {
    const session =
      sessionStorage.getItem(constants.sessionStorageKeys.USER) || '{}'
    const user = JSON.parse(session)
    if (!lodashIsEmpty(user)) {
      return false
    }
    return true
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}
