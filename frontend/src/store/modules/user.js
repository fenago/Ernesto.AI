// Packages
import { make } from 'vuex-pathify'

// Globals
import { IN_BROWSER } from '@/util/globals'

// Utilities
import axios from '../../util/axios'

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
  token: null,
}

const mutations = make.mutations(state)

const actions = {
  ...make.actions(state),

  setToken: ({ commit, dispatch }, token) => {
    if (!IN_BROWSER) return
    token = `jwt ${token}`
    sessionStorage.setItem('token', JSON.stringify(token))
    commit('token', token)
    dispatch('setHeader', token)
  },

  setHeader: ({ commit }, token) => {
    axios.defaults.headers.common.Authorization = token
  },

  clearToken: ({ commit, dispatch }) => {
    sessionStorage.removeItem('token')
    commit('token', null)
    dispatch('setHeader', null)
  },
}

const getters = {
  ...make.getters(state),

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
  getToken: state => {
    if (state.token) {
      return state.token
    }
    const local = sessionStorage.getItem('token') || '""'
    const token = JSON.parse(local)
    return token
  },
  isAuthenticated: state => {
    if (state.token) {
      return true
    }
    const local = sessionStorage.getItem('token') || '""'
    const token = JSON.parse(local)
    return !!token
  },
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}
