package domain

import "time"

// Settings 表示系统设置
type Settings struct {
	ID          int       `json:"id"`
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	Description string    `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// SystemSettings 表示系统设置的结构化数据
type SystemSettings struct {
	ShortCodeLength int `json:"short_code_length"`
}
