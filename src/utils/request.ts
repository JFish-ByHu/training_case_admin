import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'element-plus/es/components/message/style/css'
import 'nprogress/nprogress.css'
import { pinia, useAuthStore } from '@/stores'

export interface ApiResponse<T> {
  code: number
  data: T
  msg: string
}

export interface RequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /** 登录、验证码等公开接口可跳过 token。 */
  skipAuth?: boolean
  /** 页面自行处理错误时关闭统一提示。 */
  silent?: boolean
}

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

function startProgress() {
  if (pendingRequests++ === 0) NProgress.start()
}

function finishProgress() {
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

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
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

function reportError(error: ApiError, config?: RequestConfig): never {
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

/** 返回后端 data；例如退出接口应声明为 request.post<null>(...)。 */
export async function request<T, D = unknown>(config: RequestConfig<D>): Promise<T> {
  const response = await service.request<ApiResponse<T>>(config)
  return response.data.data
}

export default {
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'GET' })
  },
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'POST', data })
  },
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'PUT', data })
  },
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'PATCH', data })
  },
  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>({ ...config, url, method: 'DELETE' })
  }
}
