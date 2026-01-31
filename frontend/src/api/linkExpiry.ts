import apiClient from './client';
import type { APIResponse } from '../types/api';

// 链接过期信息类型
export interface LinkExpiry {
  id: number;
  short_code: string;
  lifecycle_days: number;
  created_at: string;
  expires_at: string;
}

// 获取已过期链接列表响应类型
export interface ExpiredLinksResponse {
  expiries: LinkExpiry[];
  total: number;
  limit: number;
  offset: number;
}

// 批量删除响应类型
export interface DeleteAllExpiredResponse {
  deleted_count: number;
}

// 获取已过期链接列表
export const getExpiredLinks = async (
  limit = 50,
  offset = 0
): Promise<APIResponse<ExpiredLinksResponse>> => {
  return apiClient.get('/link-expiry', {
    params: { limit, offset },
  });
};

// 删除单个过期记录
export const deleteExpiredLink = async (shortCode: string): Promise<APIResponse> => {
  return apiClient.delete(`/link-expiry/${shortCode}`);
};

// 批量删除所有已过期记录
export const deleteAllExpiredLinks = async (): Promise<APIResponse<DeleteAllExpiredResponse>> => {
  return apiClient.delete('/link-expiry/batch/all');
};
