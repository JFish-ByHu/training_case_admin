import request from '@/utils/request'

export interface CaptchaResult {
  captchaId: string
  captchaCode: string
  expiresIn: number
}

export interface LoginResult {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: {
    id: string
    username: string
    nickname: string
    role: 'ADMIN' | 'USER'
  }
}

export interface LoginInput {
  username: string
  password: string
  captchaId: string
  captchaCode: string
}

export function fetchCaptcha() {
  return request.get<CaptchaResult>('/auth/captcha', { skipAuth: true })
}

export function login(input: LoginInput) {
  return request.post<LoginResult>('/auth/login', input, { skipAuth: true })
}

export function logout() {
  return request.post<null>('/auth/logout')
}
