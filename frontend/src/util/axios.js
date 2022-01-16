import axios from 'axios'
import { constants } from './constants'
import store from '../store'
import router from '../router'

const instance = axios.create({
  baseURL: constants.BASE_URL,
})

axios.interceptors.response.use(undefined, function (error) {
  if (!error) {
    return
  }
  const originalRequest = error.config
  if (error.response.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true
    store.dispatch('user/clearToken')
    return router.push('/')
  }
})

export default instance
