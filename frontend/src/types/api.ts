// API响应类型
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface APIError {
  success: false;
  error: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// 链接类型
export interface Link {
  id: number;
  short_code: string;
  original_url: string;
  title?: string;
  user_id: number;
  created_at: string;
  created_ip?: string;
  is_active: boolean;
  click_count: number;
  last_clicked_at?: string;
  custom_code: boolean;
  metadata?: Record<string, any>;
}

// 统计类型
export interface DashboardStats {
  total_links: number;
  active_links: number;
  today_clicks: number;
  total_clicks: number;
}

// 访问日志类型
export interface AccessLog {
  id: number;
  link_id: number;
  ip_address: string;
  user_agent?: string;
  referer?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  accessed_at: string;
}

// 分析数据类型
export interface AnalyticsData {
  link: Link;
  access_logs: AccessLog[];
  country_stats: Record<string, number>;
}

// 登录请求类型
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应类型
export interface LoginResponse {
  session_id: string;
}

// 创建链接请求类型
export interface CreateLinkRequest {
  original_url: string;
  short_code?: string;
  title?: string;
  expires_at?: string;
}

// 创建链接响应类型
export interface CreateLinkResponse {
  id: number;
  short_code: string;
  original_url: string;
  short_url: string;
  title?: string;
  created_at: string;
}

// 系统设置类型
export interface SystemSettings {
  short_code_length: number;
}

// 更新设置请求类型
export interface UpdateSettingsRequest {
  short_code_length: number;
}
