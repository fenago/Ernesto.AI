export function leadingSlash (str) {
  return str.startsWith('/') ? str : '/' + str
}

export function trailingSlash (str) {
  return str.endsWith('/') ? str : str + '/'
}

export const wait = timeout => {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

export const baseUrl = () => {
  const url = window.location.href.split('/')
  return url[0] + '//' + url[2]
}
