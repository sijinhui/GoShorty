import apiClient from './client';
import type { APIResponse, ApiKey, GenerateApiKeyResponse } from '../types/api';

export const generateApiKey = (name: string): Promise<APIResponse<GenerateApiKeyResponse>> =>
  apiClient.post('/api-keys', { name });

export const listApiKeys = (): Promise<APIResponse<ApiKey[]>> =>
  apiClient.get('/api-keys');

export const revokeApiKey = (id: number): Promise<APIResponse<null>> =>
  apiClient.put(`/api-keys/${id}/revoke`);

export const deleteApiKey = (id: number): Promise<APIResponse<null>> =>
  apiClient.delete(`/api-keys/${id}`);