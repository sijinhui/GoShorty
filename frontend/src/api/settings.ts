import apiClient from './client';
import type {
  APIResponse,
  SystemSettings,
  UpdateSettingsRequest,
} from '../types/api';

// 获取系统设置
export const getSettings = async (): Promise<APIResponse<SystemSettings>> => {
  return apiClient.get('/settings');
};

// 更新系统设置
export const updateSettings = async (data: UpdateSettingsRequest): Promise<APIResponse<SystemSettings>> => {
  return apiClient.put('/settings', data);
};
