package service

import (
	"context"

	"GoShorty/internal/domain"
	"GoShorty/internal/repository"

	"go.uber.org/zap"
)

// LinkExpiryService 链接过期服务接口
type LinkExpiryService interface {
	ListExpired(ctx context.Context, limit, offset int) ([]*domain.LinkExpiry, error)
	DeleteExpired(ctx context.Context, shortCode string) error
	DeleteAllExpired(ctx context.Context) (int64, error)
	GetExpiredCount(ctx context.Context) (int64, error)
}

// linkExpiryService 链接过期服务实现
type linkExpiryService struct {
	linkExpiryRepo repository.LinkExpiryRepository
	logger         *zap.Logger
}

// NewLinkExpiryService 创建一个新的链接过期服务
func NewLinkExpiryService(
	linkExpiryRepo repository.LinkExpiryRepository,
	logger *zap.Logger,
) LinkExpiryService {
	return &linkExpiryService{
		linkExpiryRepo: linkExpiryRepo,
		logger:         logger,
	}
}

// ListExpired 获取已过期链接列表
func (s *linkExpiryService) ListExpired(ctx context.Context, limit, offset int) ([]*domain.LinkExpiry, error) {
	expiries, err := s.linkExpiryRepo.ListExpired(ctx, limit, offset)
	if err != nil {
		s.logger.Error("failed to list expired links", zap.Error(err))
		return nil, err
	}

	s.logger.Info("listed expired links",
		zap.Int("count", len(expiries)),
		zap.Int("limit", limit),
		zap.Int("offset", offset),
	)

	return expiries, nil
}

// DeleteExpired 删除单个过期记录
func (s *linkExpiryService) DeleteExpired(ctx context.Context, shortCode string) error {
	// 先检查是否存在且已过期
	expiry, err := s.linkExpiryRepo.GetByShortCode(ctx, shortCode)
	if err != nil {
		s.logger.Error("failed to get link expiry", zap.String("short_code", shortCode), zap.Error(err))
		return err
	}

	if !expiry.IsExpired() {
		s.logger.Warn("attempted to delete non-expired link", zap.String("short_code", shortCode))
		return domain.ErrLinkNotExpired
	}

	if err := s.linkExpiryRepo.Delete(ctx, shortCode); err != nil {
		s.logger.Error("failed to delete expired link", zap.String("short_code", shortCode), zap.Error(err))
		return err
	}

	s.logger.Info("deleted expired link", zap.String("short_code", shortCode))
	return nil
}

// DeleteAllExpired 批量删除所有已过期记录
func (s *linkExpiryService) DeleteAllExpired(ctx context.Context) (int64, error) {
	count, err := s.linkExpiryRepo.DeleteExpired(ctx)
	if err != nil {
		s.logger.Error("failed to delete all expired links", zap.Error(err))
		return 0, err
	}

	s.logger.Info("deleted all expired links", zap.Int64("count", count))
	return count, nil
}

// GetExpiredCount 获取已过期链接数量
func (s *linkExpiryService) GetExpiredCount(ctx context.Context) (int64, error) {
	// 使用 ListExpired 获取所有过期链接，然后返回数量
	// 注意：这是一个简化实现，实际应该在 repository 层添加专门的 Count 方法
	expiries, err := s.linkExpiryRepo.ListExpired(ctx, 10000, 0)
	if err != nil {
		s.logger.Error("failed to get expired count", zap.Error(err))
		return 0, err
	}

	return int64(len(expiries)), nil
}
