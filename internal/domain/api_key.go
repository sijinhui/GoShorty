package domain

import "time"

// ApiKey 表示一个API密钥
type ApiKey struct {
	ID         int        `json:"id"`
	KeyHash    string     `json:"-"`
	KeyPrefix  string     `json:"key_prefix"`
	Name       string     `json:"name"`
	UserID     int        `json:"user_id"`
	IsActive   bool       `json:"is_active"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}