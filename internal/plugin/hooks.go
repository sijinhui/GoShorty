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

// executeLinkHook runs a named hook function across all enabled link plugins.
// If haltOnError is true, execution stops and returns the first error encountered.
// If haltOnError is false, all plugins are executed and errors are only logged.
func (h *Hooks) executeLinkHook(ctx context.Context, link *domain.Link, hookName string, haltOnError bool, fn func(LinkPlugin) error) error {
	for _, p := range h.manager.GetLinkPlugins() {
		if !p.Enabled() {
			continue
		}
		if err := fn(p); err != nil {
			h.logger.Error("plugin hook failed",
				zap.String("plugin", p.Name()),
				zap.String("hook", hookName),
				zap.Error(err),
			)
			if haltOnError {
				return err
			}
		}
	}
	return nil
}

// ExecuteBeforeCreate 执行创建链接前的钩子
func (h *Hooks) ExecuteBeforeCreate(ctx context.Context, link *domain.Link) error {
	return h.executeLinkHook(ctx, link, "OnBeforeCreate", true, func(p LinkPlugin) error {
		return p.OnBeforeCreate(ctx, link)
	})
}

// ExecuteAfterCreate 执行创建链接后的钩子
func (h *Hooks) ExecuteAfterCreate(ctx context.Context, link *domain.Link) error {
	return h.executeLinkHook(ctx, link, "OnAfterCreate", false, func(p LinkPlugin) error {
		return p.OnAfterCreate(ctx, link)
	})
}

// ExecuteBeforeRedirect 执行重定向前的钩子
func (h *Hooks) ExecuteBeforeRedirect(ctx context.Context, link *domain.Link) error {
	return h.executeLinkHook(ctx, link, "OnBeforeRedirect", true, func(p LinkPlugin) error {
		return p.OnBeforeRedirect(ctx, link)
	})
}

// ExecuteAfterRedirect 执行重定向后的钩子
func (h *Hooks) ExecuteAfterRedirect(ctx context.Context, link *domain.Link) error {
	return h.executeLinkHook(ctx, link, "OnAfterRedirect", false, func(p LinkPlugin) error {
		return p.OnAfterRedirect(ctx, link)
	})
}

// CalculateExpiry 计算过期时间
func (h *Hooks) CalculateExpiry(ctx context.Context, link *domain.Link) (*time.Time, error) {
	expiryPlugin := h.manager.GetExpiryPlugin()
	if expiryPlugin == nil {
		h.logger.Warn("no expiry plugin registered")
		return nil, nil
	}

	if !expiryPlugin.Enabled() {
		h.logger.Info("expiry plugin is disabled",
			zap.String("plugin", expiryPlugin.Name()),
		)
		return nil, nil
	}

	h.logger.Debug("calling expiry plugin",
		zap.String("plugin", expiryPlugin.Name()),
		zap.String("version", expiryPlugin.Version()),
	)

	expiry, err := expiryPlugin.CalculateExpiry(ctx, link)
	if err != nil {
		h.logger.Error("expiry plugin failed",
			zap.String("plugin", expiryPlugin.Name()),
			zap.Error(err),
		)
		return nil, err
	}

	if expiry != nil {
		h.logger.Info("expiry plugin calculated expiry time",
			zap.String("plugin", expiryPlugin.Name()),
			zap.Time("expires_at", *expiry),
		)
	}

	return expiry, nil
}
