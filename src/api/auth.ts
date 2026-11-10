import request from '@/utils/request'

/** 登录验证码接口返回的数据；验证码以字符串形式保留前导零。 */
export interface CaptchaResult {
  captchaId: string
  captchaCode: string
  expiresIn: number
}

/** 登录成功后返回的访问令牌和当前用户摘要。 */
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

/** 登录请求参数，验证码 ID 与四位数字验证码必须配套提交。 */
export interface LoginInput {
  username: string
  password: string
  captchaId: string
  captchaCode: string
}

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
