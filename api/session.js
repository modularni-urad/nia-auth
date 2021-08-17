import axios from 'axios'
const SESSION_SVC = process.env.SESSION_SERVICE || 'http://session-svc'
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'Bearer'

export function createUser (samlResponse) {
  const user = Object.assign({}, samlResponse.user, {
    meta: _.pick(samlResponse, 'NameID', 'SessionIndex', 'LoA')
  })
  return user
}

export async function setSessionCookie(user, res) {
  const tokenReq = await axios.post(`${SESSION_SVC}/sign`, user)
  const token = tokenReq.data.token
  res.cookie(COOKIE_NAME, token, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000 // 1 h
  })
}

export function destroySessionCookie (res) {
  res.clearCookie(COOKIE_NAME)
}