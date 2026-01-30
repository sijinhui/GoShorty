package plugin

import (
	"context"
	"time"

	"GoShorty/internal/domain"

	"go.uber.org/zap"
)

// Hooks 钩子系统
type Hooks struct {
	manager *Manager
	logger  *zap.Logger
}

// NewHooks 创建一个新的钩子系统
func NewHooks(manager *Manager, logger *zap.Logger) *Hooks {
	return &Hooks{
		manager: manager,
		logger:  logger,
	}
}

// ExecuteBeforeCreate 执行创建链接前的钩子
func (h *Hooks) ExecuteBeforeCreate(ctx context.Context, link *domain.Link) error {
	plugins := h.manager.GetLinkPlugins()
	for _, plugin := range plugins {
		if !plugin.Enabled() {
			continue
		}
		if err := plugin.OnBeforeCreate(ctx, link); err != nil {
			h.logger.Error("plugin hook failed",
				zap.String("plugin", plugin.Name()),
				zap.String("hook", "OnBeforeCreate"),
				zap.Error(err),
			)
			return err
		}
	}
	return nil
}

// ExecuteAfterCreate 执行创建链接后的钩子
func (h *Hooks) ExecuteAfterCreate(ctx context.Context, link *domain.Link) error {
	plugins := h.manager.GetLinkPlugins()
	for _, plugin := range plugins {
		if !plugin.Enabled() {
			continue
		}
		if err := plugin.OnAfterCreate(ctx, link); err != nil {
			h.logger.Error("plugin hook failed",
				zap.String("plugin", plugin.Name()),
				zap.String("hook", "OnAfterCreate"),
				zap.Error(err),
			)
			// 不返回错误，继续执行其他插件
		}
	}
	return nil
}

// ExecuteBeforeRedirect 执行重定向前的钩子
func (h *Hooks) ExecuteBeforeRedirect(ctx context.Context, link *domain.Link) error {
	plugins := h.manager.GetLinkPlugins()
	for _, plugin := range plugins {
		if !plugin.Enabled() {
			continue
		}
		if err := plugin.OnBeforeRedirect(ctx, link); err != nil {
			h.logger.Error("plugin hook failed",
				zap.String("plugin", plugin.Name()),
				zap.String("hook", "OnBeforeRedirect"),
				zap.Error(err),
			)
			return err
		}
	}
	return nil
}

// ExecuteAfterRedirect 执行重定向后的钩子
func (h *Hooks) ExecuteAfterRedirect(ctx context.Context, link *domain.Link) error {
	plugins := h.manager.GetLinkPlugins()
	for _, plugin := range plugins {
		if !plugin.Enabled() {
			continue
		}
		if err := plugin.OnAfterRedirect(ctx, link); err != nil {
			h.logger.Error("plugin hook failed",
				zap.String("plugin", plugin.Name()),
				zap.String("hook", "OnAfterRedirect"),
				zap.Error(err),
			)
			// 不返回错误，继续执行其他插件
		}
	}
	return nil
}

// CalculateExpiry 计算过期时间
func (h *Hooks) CalculateExpiry(ctx context.Context, link *domain.Link) (*time.Time, error) {
	expiryPlugin := h.manager.GetExpiryPlugin()
	if expiryPlugin == nil || !expiryPlugin.Enabled() {
		return nil, nil
	}

	expiry, err := expiryPlugin.CalculateExpiry(ctx, link)
	if err != nil {
		h.logger.Error("expiry plugin failed",
			zap.String("plugin", expiryPlugin.Name()),
			zap.Error(err),
		)
		return nil, err
	}

	return expiry, nil
}
