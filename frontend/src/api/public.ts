import axios from 'axios';
import type { APIResponse } from '../types/api';

// 创建公开API客户端（不需要认证）
const publicClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 公开创建短链接
export const createPublicLink = async (data: {
  original_url: string;
  short_code?: string;
}): Promise<APIResponse<{
  short_code: string;
  original_url: string;
  short_url: string;
  created_at: string;
}>> => {
  const response = await publicClient.post('/shorten', {
    url: data.original_url,
    custom_code: data.short_code,
  });
  return response.data;
};