package domain

import (
	"time"
)

// Link 表示一个短链接
type Link struct {
	ID             int64      `json:"id"`
	ShortCode      string     `json:"short_code"`
	OriginalURL    string     `json:"original_url"`
	Title          string     `json:"title,omitempty"`
	UserID         int        `json:"user_id"`
	CreatedAt      time.Time  `json:"created_at"`
	CreatedIP      *string    `json:"created_ip,omitempty"`
	IsActive       bool       `json:"is_active"`
	ClickCount     int        `json:"click_count"`
	LastClickedAt  *time.Time `json:"last_clicked_at,omitempty"`
	CustomCode     bool       `json:"custom_code"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// IsValid 检查链接是否有效（处于活跃状态）
// 注意：过期检查现在由 LinkExpiry 表和插件系统处理
func (l *Link) IsValid() bool {
	return l.IsActive
}

// IncrementClickCount 增加点击计数
func (l *Link) IncrementClickCount() {
	l.ClickCount++
	now := time.Now()
	l.LastClickedAt = &now
}
