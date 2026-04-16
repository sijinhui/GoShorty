package service

import (
	"context"
	"sync"
	"time"

	"GoShorty/internal/repository"

	"go.uber.org/zap"
)

// CleanupService 过期链接清理服务
type CleanupService struct {
	linkExpiryRepo repository.LinkExpiryRepository
	logger         *zap.Logger
	stopChan       chan struct{}
	wg             sync.WaitGroup
	gracePeriod    time.Duration // 过期后保留的宽限期
	interval       time.Duration // 清理间隔
}

// NewCleanupService 创建清理服务
// gracePeriodDays: 过期后保留的天数（超过此天数的才清理）
// intervalHours: 清理间隔（小时）
func NewCleanupService(
	linkExpiryRepo repository.LinkExpiryRepository,
	logger *zap.Logger,
	gracePeriodDays int,
	intervalHours int,
) *CleanupService {
	return &CleanupService{
		linkExpiryRepo: linkExpiryRepo,
		logger:         logger,
		stopChan:       make(chan struct{}),
		gracePeriod:    time.Duration(gracePeriodDays) * 24 * time.Hour,
		interval:       time.Duration(intervalHours) * time.Hour,
	}
}

// Start 启动定时清理任务
func (s *CleanupService) Start() {
	s.wg.Add(1)
	go s.run()
	s.logger.Info("Cleanup service started",
		zap.Duration("grace_period", s.gracePeriod),
		zap.Duration("interval", s.interval),
	)
}

// Stop 停止清理服务
func (s *CleanupService) Stop() {
	close(s.stopChan)
	s.wg.Wait()
	s.logger.Info("Cleanup service stopped")
}

func (s *CleanupService) run() {
	defer s.wg.Done()

	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()

	// 启动时先等待一个周期再执行，避免启动时立即清理
	s.logger.Info("Cleanup service waiting for first run", zap.Duration("wait", s.interval))

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.cleanup()
		}
	}
}

func (s *CleanupService) cleanup() {
	ctx := context.Background()

	// 计算清理截止时间：当前时间 - 宽限期
	// 即：删除 expires_at < (NOW() - 宽限期) 的记录
	cutoff := time.Now().Add(-s.gracePeriod)

	s.logger.Info("Starting cleanup of expired links",
		zap.Time("cutoff", cutoff),
		zap.String("cutoff_desc", cutoff.Format("2006-01-02 15:04:05")),
	)

	count, err := s.linkExpiryRepo.DeleteExpiredBefore(ctx, cutoff)
	if err != nil {
		s.logger.Error("Failed to cleanup expired links", zap.Error(err))
		return
	}

	if count > 0 {
		s.logger.Info("Cleanup completed",
			zap.Int64("deleted_count", count),
			zap.Duration("grace_period_days", s.gracePeriod),
		)
	} else {
		s.logger.Debug("Cleanup completed, no expired links to delete")
	}
}

// RunOnce 立即执行一次清理（用于测试或手动触发）
func (s *CleanupService) RunOnce(ctx context.Context) (int64, error) {
	cutoff := time.Now().Add(-s.gracePeriod)
	return s.linkExpiryRepo.DeleteExpiredBefore(ctx, cutoff)
}
