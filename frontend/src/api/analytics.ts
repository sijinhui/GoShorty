import apiClient from './client';
import type { APIResponse, AnalyticsData } from '../types/api';

// 获取链接统计数据
export const getLinkAnalytics = async (linkId: number): Promise<APIResponse<AnalyticsData>> => {
  return apiClient.get('/analytics/link', {
    params: { link_id: linkId },
  });
};

// 通过短码获取链接统计数据（用于 /admin/links/:shortCode+ 页面）
export const getLinkAnalyticsByShortCode = async (shortCode: string): Promise<APIResponse<AnalyticsData>> => {
  return apiClient.get(`/links/${encodeURIComponent(shortCode)}/analytics`);
};
