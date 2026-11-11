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
