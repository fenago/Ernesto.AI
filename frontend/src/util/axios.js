import axios from 'axios'
import { baseUrl } from './helpers'
// import store from '../store/index'

const instance = axios.create({
  baseURL: baseUrl(),
})

// response interceptor
instance.interceptors.response.use(
  response => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response
  },
  error => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // unautherized
    // if (error.response.status === 403) {
    //   store.dispatch('user/clearSession')
    //   location.assign(`${baseUrl()}/logout`)
    // }
    return Promise.reject(error)
  },
)

export default instance
