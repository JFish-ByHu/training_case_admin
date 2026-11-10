import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'element-plus/es/components/message/style/css'
import 'nprogress/nprogress.css'
import { pinia, useAuthStore } from '@/stores'

/** 后端统一响应结构；业务成功与否由 code 判断，而非仅看 HTTP 状态。 */
export interface ApiResponse<T> {
  code: number
  data: T
  msg: string
}

/** 扩展 Axios 配置，用于声明请求认证和统一错误提示行为。 */
export interface RequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /** 登录、验证码等公开接口跳过 Authorization 请求头。 */
  skipAuth?: boolean
  /** 页面自行处理错误时关闭统一提示。 */
  silent?: boolean
}

/** 请求失败的统一异常，保留后端业务码和 HTTP 状态码。 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly status?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

NProgress.configure({ showSpinner: false })
let pendingRequests = 0

const startProgress = () => {
  if (pendingRequests++ === 0) NProgress.start()
}

const finishProgress = () => {
  if (pendingRequests === 0) return
  if (--pendingRequests === 0) NProgress.done()
}

service.interceptors.request.use(config => {
  const { skipAuth } = config as RequestConfig
  const { token } = useAuthStore(pinia)
  if (skipAuth) {
    config.headers.delete('Authorization')
  } else if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  startProgress()
  return config
})

const isApiResponse = (value: unknown): value is ApiResponse<unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'number' &&
    'msg' in value &&
    typeof value.msg === 'string' &&
    'data' in value
  )
}

const reportError = (error: ApiError, config?: RequestConfig): never => {
  // 登录失败也可能是 401；公开接口不应清除已有登录状态。
  if ((error.status === 401 || error.code === 401) && !config?.skipAuth) {
    useAuthStore(pinia).removeToken()
  }
  if (!config?.silent) {
    ElMessage.error({ message: error.message, grouping: true })
  }
  throw error
}

service.interceptors.response.use(
  response => {
    finishProgress()
    const body: unknown = response.data
    if (!isApiResponse(body)) {
      return reportError(
        new ApiError('Invalid server response', undefined, response.status),
        response.config
      )
    }
    // 同时处理 HTTP 200 中的业务失败。
    if (body.code < 200 || body.code >= 300) {
      return reportError(
        new ApiError(body.msg || 'Request failed', body.code, response.status),
        response.config
      )
    }
    return response
  },
  (error: unknown) => {
    finishProgress()
    // 用户主动取消请求时，不显示错误提示。
    if (axios.isCancel(error)) return Promise.reject(error)
    if (axios.isAxiosError(error)) {
      const body: unknown = error.response?.data
      const message = isApiResponse(body)
        ? body.msg || 'Request failed'
        : error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          ? 'Request timed out'
          : error.response
            ? `Request failed (${error.response.status})`
            : 'Network error'
      return reportError(
        new ApiError(message, isApiResponse(body) ? body.code : undefined, error.response?.status),
        error.config
      )
    }
    return reportError(new ApiError('Request failed'))
  }
)

/**
 * 发送请求并仅返回统一响应中的 data 字段。
 * @typeParam T - 后端 data 字段的类型。
 * @typeParam D - 请求体数据类型。
 * @param config - Axios 请求配置及本项目的认证/提示扩展项。
 * @returns 后端响应中的 data 内容。
 */
export const request = async <T, D = unknown>(config: RequestConfig<D>): Promise<T> => {
  const response = await service.request<ApiResponse<T>>(config)
  return response.data.data
}

/** 简化常见 HTTP 方法调用并统一返回后端 data 字段。 */
export default {
  /** 发送 GET 请求。 */
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'GET' })
  },
  /** 发送 POST 请求。 */
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'POST', data })
  },
  /** 发送 PUT 请求。 */
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'PUT', data })
  },
  /** 发送 PATCH 请求。 */
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'PATCH', data })
  },
  /** 发送 DELETE 请求；如需请求体，请通过 config.data 传入。 */
  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'DELETE' })
  }
}
