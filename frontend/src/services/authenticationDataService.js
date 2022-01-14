import axios from '../util/axios'

export const authenticationDataService = (function () {
  const login = (payload) => {
    const url = '/api-token-auth/'
    return axios.post(url, payload).then(res => res.data)
  }

  return {
    login,
  }
})()
