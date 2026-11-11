import request from '@/utils/request'
import type { CaptchaResult, LoginInput, LoginResult } from './types/auth'

/**
 * 获取不缓存的四位数字验证码；此公开接口不携带登录令牌。
 * @returns 验证码 ID、四位数字内容和有效秒数。
 */
export const fetchCaptcha = () => request.get<CaptchaResult>('/auth/captcha', { skipAuth: true })

/**
 * 使用账号、密码和一次性验证码登录并返回访问令牌。
 * @param input 登录凭据及本次验证码信息。
 * @returns 访问令牌、有效时间和登录用户摘要。
 */
export const login = (input: LoginInput) =>
  request.post<LoginResult>('/auth/login', input, { skipAuth: true })

/**
 * 请求服务端撤销当前访问令牌关联的会话。
 * @returns 成功时返回空数据。
 */
export const logout = () => request.post<null>('/auth/logout')
