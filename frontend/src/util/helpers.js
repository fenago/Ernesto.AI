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

export const getDateTime = (timestamp = null) => {
  const dateTime = timestamp ? new Date(timestamp) : new Date()
  return `${dateTime.getDate()}/${(dateTime.getMonth() + 1)}/${dateTime.getFullYear()} & ${dateTime.getHours()}:${dateTime.getMinutes()}:${dateTime.getSeconds()}`
}
