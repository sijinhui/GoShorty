package domain

import "time"

// RateLimit 表示速率限制记录
type RateLimit struct {
	ID        int64     `json:"id"`
	IP        string    `json:"ip"`         // 客户端IP地址
	Endpoint  string    `json:"endpoint"`   // 请求端点
	Count     int       `json:"count"`      // 请求次数
	WindowEnd time.Time `json:"window_end"` // 时间窗口结束时间
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// RateLimitConfig 速率限制配置
type RateLimitConfig struct {
	Enabled       bool `json:"enabled"`        // 是否启用速率限制
	RequestsLimit int  `json:"requests_limit"` // 时间窗口内允许的最大请求数
	WindowMinutes int  `json:"window_minutes"` // 时间窗口大小（分钟）
}

// IsExpired 检查时间窗口是否已过期
func (r *RateLimit) IsExpired() bool {
	return time.Now().After(r.WindowEnd)
}

// CanRequest 检查是否可以继续请求
func (r *RateLimit) CanRequest(limit int) bool {
	return r.Count < limit
}
