import apiClient from './client';
import type { APIResponse, AnalyticsData } from '../types/api';

// 获取链接统计数据
export const getLinkAnalytics = async (
  linkId: number,
  page = 1,
  limit = 10,
): Promise<APIResponse<AnalyticsData>> => {
  return apiClient.get('/analytics/link', {
    params: { link_id: linkId, page, limit },
  });
};

// 通过短码获取链接统计数据（用于 /admin/links/:shortCode+ 页面）
export const getLinkAnalyticsByShortCode = async (
  shortCode: string,
  page = 1,
  limit = 10,
): Promise<APIResponse<AnalyticsData>> => {
  return apiClient.get(`/links/${encodeURIComponent(shortCode)}/analytics`, {
    params: { page, limit },
  });
};
