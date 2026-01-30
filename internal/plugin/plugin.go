package plugin

import (
	"context"
	"time"

	"GoShorty/internal/domain"
)

// Plugin 插件接口
type Plugin interface {
	// Name 返回插件名称
	Name() string

	// Version 返回插件版本
	Version() string

	// Init 初始化插件
	Init() error

	// Enabled 返回插件是否启用
	Enabled() bool
}

// LinkPlugin 链接相关插件接口
type LinkPlugin interface {
	Plugin

	// OnBeforeCreate 创建链接前的钩子
	OnBeforeCreate(ctx context.Context, link *domain.Link) error

	// OnAfterCreate 创建链接后的钩子
	OnAfterCreate(ctx context.Context, link *domain.Link) error

	// OnBeforeRedirect 重定向前的钩子
	OnBeforeRedirect(ctx context.Context, link *domain.Link) error

	// OnAfterRedirect 重定向后的钩子
	OnAfterRedirect(ctx context.Context, link *domain.Link) error
}

// ExpiryPlugin 过期策略插件接口
type ExpiryPlugin interface {
	Plugin

	// CalculateExpiry 计算过期时间
	CalculateExpiry(ctx context.Context, link *domain.Link) (*time.Time, error)
}
