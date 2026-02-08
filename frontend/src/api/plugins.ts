import apiClient from './client';
import type { APIResponse } from '../types/api';

// 插件信息类型
export interface Plugin {
  name: string;
  version: string;
  enabled: boolean;
  type: string;
  days?: string;
}

// 插件列表响应类型
export interface PluginsResponse {
  plugins: Plugin[];
}

// 更新插件配置请求类型
export interface UpdatePluginConfigRequest {
  enabled?: boolean;
  days?: number;
}

// 获取所有插件列表
export const getPlugins = async (): Promise<APIResponse<PluginsResponse>> => {
  return apiClient.get('/plugins');
};

// 更新插件配置
export const updatePluginConfig = async (
  name: string,
  data: UpdatePluginConfigRequest
): Promise<APIResponse<{ message: string }>> => {
  return apiClient.put(`/plugins/${name}/config`, data);
};
