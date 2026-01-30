import apiClient from './client';
import type {
  APIResponse,
  PaginatedResponse,
  DashboardStats,
  Link,
  CreateLinkRequest,
  CreateLinkResponse,
} from '../types/api';

// 获取仪表盘统计数据
export const getDashboardStats = async (): Promise<APIResponse<DashboardStats>> => {
  return apiClient.get('/dashboard/stats');
};

// 创建短链接
export const createLink = async (data: CreateLinkRequest): Promise<APIResponse<CreateLinkResponse>> => {
  return apiClient.post('/links', data);
};

// 获取链接列表
export const getLinks = async (page = 1, limit = 20): Promise<PaginatedResponse<Link>> => {
  return apiClient.get('/links', {
    params: { page, limit },
  });
};

// 删除链接
export const deleteLink = async (id: number): Promise<APIResponse> => {
  return apiClient.delete(`/links/${id}`);
};
