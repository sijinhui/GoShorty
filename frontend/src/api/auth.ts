import apiClient from './client';
import type { APIResponse, LoginRequest, LoginResponse } from '../types/api';

// 登录
export const login = async (data: LoginRequest): Promise<APIResponse<LoginResponse>> => {
  return apiClient.post('/auth/login', data);
};

// 登出
export const logout = async (): Promise<APIResponse> => {
  return apiClient.post('/logout');
};

// 验证会话（可选，用于检查登录状态）
export const checkAuth = async (): Promise<APIResponse> => {
  return apiClient.get('/auth/check');
};
