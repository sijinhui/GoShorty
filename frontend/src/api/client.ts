import axios from 'axios';
import type { APIError } from '../types/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/admin/api',
  timeout: 10000,
  withCredentials: true, // 发送Cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const apiError: APIError = error.response.data;

      // 处理401未授权错误
      if (error.response.status === 401) {
        // 清除本地认证状态
        window.location.href = '/login';
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
