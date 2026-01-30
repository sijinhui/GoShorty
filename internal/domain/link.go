package domain

import (
	"time"
)

// Link 表示一个短链接
type Link struct {
	ID             int64     `json:"id"`
	ShortCode      string    `json:"short_code"`
	OriginalURL    string    `json:"original_url"`
	Title          string    `json:"title,omitempty"`
	UserID         int       `json:"user_id"`
	CreatedAt      time.Time `json:"created_at"`
	ExpiresAt      *time.Time `json:"expires_at,omitempty"`
	IsActive       bool      `json:"is_active"`
	ClickCount     int       `json:"click_count"`
	LastClickedAt  *time.Time `json:"last_clicked_at,omitempty"`
	CustomCode     bool      `json:"custom_code"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// IsExpired 检查链接是否已过期
func (l *Link) IsExpired() bool {
	if l.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*l.ExpiresAt)
}

// IsValid 检查链接是否有效（未过期且处于活跃状态）
func (l *Link) IsValid() bool {
	return l.IsActive && !l.IsExpired()
}

// IncrementClickCount 增加点击计数
func (l *Link) IncrementClickCount() {
	l.ClickCount++
	now := time.Now()
	l.LastClickedAt = &now
}
