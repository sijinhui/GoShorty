package service

import (
	"context"
	"time"

	"GoShorty/internal/domain"
	"GoShorty/internal/repository"

	"go.uber.org/zap"
)

// RateLimitService 速率限制服务接口
type RateLimitService interface {
	CheckRateLimit(ctx context.Context, ip, endpoint string) (bool, error)
}

// rateLimitService 速率限制服务实现
type rateLimitService struct {
	rateLimitRepo   repository.RateLimitRepository
	settingsService SettingsService
	logger          *zap.Logger
}

// NewRateLimitService 创建一个新的速率限制服务
func NewRateLimitService(
	rateLimitRepo repository.RateLimitRepository,
	settingsService SettingsService,
	logger *zap.Logger,
) RateLimitService {
	return &rateLimitService{
		rateLimitRepo:   rateLimitRepo,
		settingsService: settingsService,
		logger:          logger,
	}
}

// CheckRateLimit 检查是否超过速率限制
func (s *rateLimitService) CheckRateLimit(ctx context.Context, ip, endpoint string) (bool, error) {
	config, err := s.settingsService.GetRateLimitConfig(ctx)
	if err != nil {
		s.logger.Error("failed to get rate limit config", zap.Error(err))
		return true, nil // 配置获取失败时允许请求
	}

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
		if createErr := s.rateLimitRepo.Create(ctx, newRateLimit); createErr != nil {
			s.logger.Error("failed to create rate limit record", zap.Error(createErr))
		}
		return true, nil
	}

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
	if updateErr := s.rateLimitRepo.Update(ctx, rateLimit); updateErr != nil {
		s.logger.Error("failed to update rate limit record", zap.Error(updateErr))
	}

	return true, nil
}
