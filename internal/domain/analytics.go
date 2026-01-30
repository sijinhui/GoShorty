package domain

import "time"

// AccessLog 表示一条访问日志记录
type AccessLog struct {
	ID         int64     `json:"id"`
	LinkID     int64     `json:"link_id"`
	IPAddress  string    `json:"ip_address"`
	UserAgent  string    `json:"user_agent,omitempty"`
	Referer    string    `json:"referer,omitempty"`
	Country    string    `json:"country,omitempty"`
	City       string    `json:"city,omitempty"`
	Latitude   *float64  `json:"latitude,omitempty"`
	Longitude  *float64  `json:"longitude,omitempty"`
	AccessedAt time.Time `json:"accessed_at"`
}

// Session 表示一个用户会话
type Session struct {
	ID        string                 `json:"id"`
	UserID    int                    `json:"user_id"`
	Data      map[string]interface{} `json:"data,omitempty"`
	ExpiresAt time.Time              `json:"expires_at"`
	CreatedAt time.Time              `json:"created_at"`
}

// IsExpired 检查会话是否已过期
func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}
