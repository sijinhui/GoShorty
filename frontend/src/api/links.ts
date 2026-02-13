import axios from 'axios';
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
export const getLinks = async (page = 1, limit = 10, keyword?: string): Promise<PaginatedResponse<Link>> => {
  return apiClient.get('/links', {
    params: { page, limit, keyword },
  });
};

// 删除链接
export const deleteLink = async (id: number): Promise<APIResponse> => {
  return apiClient.delete(`/links/${id}`);
};

// 导出链接为CSV
export const exportLinks = async (): Promise<Blob> => {
  // 直接使用 axios 而不是 apiClient，避免响应拦截器影响 blob 数据
  const response = await axios.get('/admin/api/links/export', {
    responseType: 'blob',
    withCredentials: true,
  });
  return response.data;
};

// 导入CSV文件
export const importLinks = async (file: File): Promise<APIResponse<{
  success_count: number;
  fail_count: number;
  total: number;
  errors?: string[];
}>> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/links/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
