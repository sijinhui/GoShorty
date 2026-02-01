package service

import (
	"context"
	"strconv"
	"time"

	"GoShorty/internal/domain"
	"GoShorty/internal/repository"

	"go.uber.org/zap"
)

// RateLimitService 速率限制服务接口
type RateLimitService interface {
	CheckRateLimit(ctx context.Context, ip, endpoint string) (bool, error)
	GetRateLimitConfig(ctx context.Context) (*domain.RateLimitConfig, error)
	UpdateRateLimitConfig(ctx context.Context, config *domain.RateLimitConfig) error
}

// rateLimitService 速率限制服务实现
type rateLimitService struct {
	rateLimitRepo repository.RateLimitRepository
	settingsRepo  repository.SettingsRepository
	logger        *zap.Logger
}

// NewRateLimitService 创建一个新的速率限制服务
func NewRateLimitService(
	rateLimitRepo repository.RateLimitRepository,
	settingsRepo repository.SettingsRepository,
	logger *zap.Logger,
) RateLimitService {
	return &rateLimitService{
		rateLimitRepo: rateLimitRepo,
		settingsRepo:  settingsRepo,
		logger:        logger,
	}
}

// CheckRateLimit 检查是否超过速率限制
func (s *rateLimitService) CheckRateLimit(ctx context.Context, ip, endpoint string) (bool, error) {
	// 获取速率限制配置
	config, err := s.GetRateLimitConfig(ctx)
	if err != nil {
		s.logger.Error("failed to get rate limit config", zap.Error(err))
		return true, nil // 配置获取失败时允许请求
	}

	// 如果未启用速率限制，直接允许
	if !config.Enabled {
		return true, nil
	}

	// 查询现有的速率限制记录
	rateLimit, err := s.rateLimitRepo.GetByIPAndEndpoint(ctx, ip, endpoint)
	if err != nil {
		// 没有记录，创建新记录
		windowEnd := time.Now().Add(time.Duration(config.WindowMinutes) * time.Minute)
		newRateLimit := &domain.RateLimit{
			IP:        ip,
			Endpoint:  endpoint,
			Count:     1,
			WindowEnd: windowEnd,
		}
		if err := s.rateLimitRepo.Create(ctx, newRateLimit); err != nil {
			s.logger.Error("failed to create rate limit record", zap.Error(err))
			return true, nil // 创建失败时允许请求
		}
		return true, nil
	}

	// 检查是否超过限制
	if !rateLimit.CanRequest(config.RequestsLimit) {
		s.logger.Warn("rate limit exceeded",
			zap.String("ip", ip),
			zap.String("endpoint", endpoint),
			zap.Int("count", rateLimit.Count),
			zap.Int("limit", config.RequestsLimit))
		return false, nil
	}

	// 更新计数
	rateLimit.Count++
	if err := s.rateLimitRepo.Update(ctx, rateLimit); err != nil {
		s.logger.Error("failed to update rate limit record", zap.Error(err))
		return true, nil // 更新失败时允许请求
	}

	return true, nil
}

// GetRateLimitConfig 获取速率限制配置
func (s *rateLimitService) GetRateLimitConfig(ctx context.Context) (*domain.RateLimitConfig, error) {
	config := &domain.RateLimitConfig{
		Enabled:       false,
		RequestsLimit: 10,
		WindowMinutes: 1,
	}

	// 获取启用状态
	enabledSetting, err := s.settingsRepo.GetByKey(ctx, "rate_limit.enabled")
	if err == nil && enabledSetting.Value == "true" {
		config.Enabled = true
	}

	// 获取请求限制
	limitSetting, err := s.settingsRepo.GetByKey(ctx, "rate_limit.requests_limit")
	if err == nil {
		if limit, parseErr := strconv.Atoi(limitSetting.Value); parseErr == nil && limit > 0 {
			config.RequestsLimit = limit
		}
	}

	// 获取时间窗口
	windowSetting, err := s.settingsRepo.GetByKey(ctx, "rate_limit.window_minutes")
	if err == nil {
		if window, parseErr := strconv.Atoi(windowSetting.Value); parseErr == nil && window > 0 {
			config.WindowMinutes = window
		}
	}

	return config, nil
}

// UpdateRateLimitConfig 更新速率限制配置
func (s *rateLimitService) UpdateRateLimitConfig(ctx context.Context, config *domain.RateLimitConfig) error {
	// 更新启用状态
	enabledValue := "false"
	if config.Enabled {
		enabledValue = "true"
	}
	if err := s.settingsRepo.Update(ctx, "rate_limit.enabled", enabledValue); err != nil {
		s.logger.Error("failed to update rate_limit.enabled", zap.Error(err))
		return err
	}

	// 更新请求限制
	if config.RequestsLimit > 0 {
		limitValue := strconv.Itoa(config.RequestsLimit)
		if err := s.settingsRepo.Update(ctx, "rate_limit.requests_limit", limitValue); err != nil {
			s.logger.Error("failed to update rate_limit.requests_limit", zap.Error(err))
			return err
		}
	}

	// 更新时间窗口
	if config.WindowMinutes > 0 {
		windowValue := strconv.Itoa(config.WindowMinutes)
		if err := s.settingsRepo.Update(ctx, "rate_limit.window_minutes", windowValue); err != nil {
			s.logger.Error("failed to update rate_limit.window_minutes", zap.Error(err))
			return err
		}
	}

	s.logger.Info("rate limit config updated", zap.Bool("enabled", config.Enabled))
	return nil
}
