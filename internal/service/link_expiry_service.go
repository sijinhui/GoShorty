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
	CancelExpiry(ctx context.Context, shortCode string) error
	GetExpiredCount(ctx context.Context) (int64, error)
}

// linkExpiryService 链接过期服务实现
type linkExpiryService struct {
	linkExpiryRepo repository.LinkExpiryRepository
	linkRepo       repository.LinkRepository
	logger         *zap.Logger
}

// NewLinkExpiryService 创建一个新的链接过期服务
func NewLinkExpiryService(
	linkExpiryRepo repository.LinkExpiryRepository,
	linkRepo repository.LinkRepository,
	logger *zap.Logger,
) LinkExpiryService {
	return &linkExpiryService{
		linkExpiryRepo: linkExpiryRepo,
		linkRepo:       linkRepo,
		logger:         logger,
	}
}

// ListExpired 获取所有有过期设置的链接列表（包括已过期和未过期的）
func (s *linkExpiryService) ListExpired(ctx context.Context, limit, offset int) ([]*domain.LinkExpiry, error) {
	expiries, err := s.linkExpiryRepo.ListExpired(ctx, limit, offset)
	if err != nil {
		s.logger.Error("failed to list expired links", zap.Error(err))
		return nil, err
	}

	s.logger.Info("listed links with expiry settings",
		zap.Int("count", len(expiries)),
		zap.Int("limit", limit),
		zap.Int("offset", offset),
	)

	return expiries, nil
}

// DeleteExpired 删除单个过期记录及其对应的链接
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

	// 先删除链接本身
	_, err = s.linkRepo.DeleteByShortCodes(ctx, []string{shortCode})
	if err != nil {
		s.logger.Error("failed to delete link", zap.String("short_code", shortCode), zap.Error(err))
		// 继续删除过期记录
	}

	// 再删除过期记录
	if err := s.linkExpiryRepo.Delete(ctx, shortCode); err != nil {
		s.logger.Error("failed to delete expired link", zap.String("short_code", shortCode), zap.Error(err))
		return err
	}

	s.logger.Info("deleted expired link and its record", zap.String("short_code", shortCode))
	return nil
}

// DeleteAllExpired 批量删除所有已过期记录及其对应的链接
func (s *linkExpiryService) DeleteAllExpired(ctx context.Context) (int64, error) {
	// 先获取所有有过期设置的链接
	allExpiries, err := s.linkExpiryRepo.ListExpired(ctx, 10000, 0)
	if err != nil {
		s.logger.Error("failed to list expired links", zap.Error(err))
		return 0, err
	}

	// 筛选出真正已过期的链接
	var expiredShortCodes []string
	for _, expiry := range allExpiries {
		if expiry.IsExpired() {
			expiredShortCodes = append(expiredShortCodes, expiry.ShortCode)
		}
	}

	if len(expiredShortCodes) == 0 {
		s.logger.Info("no expired links to delete")
		return 0, nil
	}

	// 先删除 links 表中的对应链接
	deletedLinks, err := s.linkRepo.DeleteByShortCodes(ctx, expiredShortCodes)
	if err != nil {
		s.logger.Error("failed to delete links by short codes", zap.Error(err))
		// 继续删除过期记录
	}

	// 再删除过期记录（使用 DeleteExpired 会删除所有 expires_at < NOW() 的记录）
	count, err := s.linkExpiryRepo.DeleteExpired(ctx)
	if err != nil {
		s.logger.Error("failed to delete all expired links", zap.Error(err))
		return 0, err
	}

	s.logger.Info("deleted all expired links",
		zap.Int64("expiry_records", count),
		zap.Int64("deleted_links", deletedLinks),
	)
	return count, nil
}

// GetExpiredCount 获取所有有过期设置的链接数量
func (s *linkExpiryService) GetExpiredCount(ctx context.Context) (int64, error) {
	// 使用 ListExpired 获取所有有过期设置的链接，然后返回数量
	// 注意：这是一个简化实现，实际应该在 repository 层添加专门的 Count 方法
	expiries, err := s.linkExpiryRepo.ListExpired(ctx, 10000, 0)
	if err != nil {
		s.logger.Error("failed to get expired count", zap.Error(err))
		return 0, err
	}

	return int64(len(expiries)), nil
}

// CancelExpiry 取消链接的过期设置（只删除过期记录，保留链接）
func (s *linkExpiryService) CancelExpiry(ctx context.Context, shortCode string) error {
	// 检查过期记录是否存在
	_, err := s.linkExpiryRepo.GetByShortCode(ctx, shortCode)
	if err != nil {
		s.logger.Error("failed to get link expiry", zap.String("short_code", shortCode), zap.Error(err))
		return err
	}

	// 只删除过期记录，不删除链接
	if err := s.linkExpiryRepo.Delete(ctx, shortCode); err != nil {
		s.logger.Error("failed to cancel expiry", zap.String("short_code", shortCode), zap.Error(err))
		return err
	}

	s.logger.Info("cancelled link expiry", zap.String("short_code", shortCode))
	return nil
}
