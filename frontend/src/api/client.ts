import axios from 'axios';
import type { APIError } from '../types/api';

const apiClient = axios.create({
  baseURL: '/admin/api',
  timeout: 10000,
  withCredentials: true, // 发送Cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const apiError: APIError = error.response.data;

      // 处理401未授权错误
      if (error.response.status === 401) {
        // 只有不在登录页时才重定向，避免无限循环
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/admin/login';
        }
      }

      return Promise.reject(apiError);
    }

    // 网络错误或其他错误
    return Promise.reject({
      success: false,
      error: error.message || '网络错误',
      code: 'NETWORK_ERROR',
    } as APIError);
  }
);

export default apiClient;
