package domain

import "time"

// LinkExpiry 链接过期信息
type LinkExpiry struct {
	ID            int64     `json:"id"`
	ShortCode     string    `json:"short_code"`
	LifecycleDays int       `json:"lifecycle_days"`
	CreatedAt     time.Time `json:"created_at"`
	ExpiresAt     time.Time `json:"expires_at"`
}

// IsExpired 检查链接是否已过期
func (le *LinkExpiry) IsExpired() bool {
	return time.Now().After(le.ExpiresAt)
}

// RemainingDays 计算剩余天数
func (le *LinkExpiry) RemainingDays() int {
	if le.IsExpired() {
		return 0
	}
	duration := time.Until(le.ExpiresAt)
	return int(duration.Hours() / 24)
}
