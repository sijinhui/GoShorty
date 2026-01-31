package expiration

import (
	"context"
	"time"

	"GoShorty/internal/domain"
)

// SevenDayExpiryPlugin 7天过期插件
type SevenDayExpiryPlugin struct {
	enabled bool
	days    int
}

// NewSevenDayExpiryPlugin 创建一个新的7天过期插件
func NewSevenDayExpiryPlugin() *SevenDayExpiryPlugin {
	return &SevenDayExpiryPlugin{
		enabled: true,
		days:    7, // 默认7天
	}
}

// Name 返回插件名称
func (p *SevenDayExpiryPlugin) Name() string {
	return "seven_day_expiry"
}

// Version 返回插件版本
func (p *SevenDayExpiryPlugin) Version() string {
	return "1.0.0"
}

// Init 初始化插件
func (p *SevenDayExpiryPlugin) Init() error {
	return nil
}

// Enabled 返回插件是否启用
func (p *SevenDayExpiryPlugin) Enabled() bool {
	return p.enabled
}

// SetEnabled 设置插件启用状态
func (p *SevenDayExpiryPlugin) SetEnabled(enabled bool) {
	p.enabled = enabled
}

// SetDays 设置过期天数
func (p *SevenDayExpiryPlugin) SetDays(days int) {
	if days > 0 {
		p.days = days
	}
}

// CalculateExpiry 计算过期时间
func (p *SevenDayExpiryPlugin) CalculateExpiry(ctx context.Context, link *domain.Link) (*time.Time, error) {
	// 计算默认过期时间（当前时间 + 配置的天数）
	expiry := time.Now().AddDate(0, 0, p.days)
	return &expiry, nil
}
