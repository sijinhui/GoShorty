package service

import (
	"context"
	"strconv"

	"GoShorty/internal/domain"
	"GoShorty/internal/repository"

	"go.uber.org/zap"
)

// SettingsService 设置服务接口
type SettingsService interface {
	GetShortCodeLength(ctx context.Context) (int, error)
	UpdateShortCodeLength(ctx context.Context, length int) error
	GetSystemSettings(ctx context.Context) (*domain.SystemSettings, error)
}

// settingsService 设置服务实现
type settingsService struct {
	settingsRepo repository.SettingsRepository
	logger       *zap.Logger
}

// NewSettingsService 创建一个新的设置服务
func NewSettingsService(
	settingsRepo repository.SettingsRepository,
	logger *zap.Logger,
) SettingsService {
	return &settingsService{
		settingsRepo: settingsRepo,
		logger:       logger,
	}
}

// GetShortCodeLength 获取短链接长度设置
func (s *settingsService) GetShortCodeLength(ctx context.Context) (int, error) {
	setting, err := s.settingsRepo.GetByKey(ctx, "short_code_length")
	if err != nil {
		s.logger.Error("failed to get short_code_length setting", zap.Error(err))
		return 6, err // 默认返回6
	}

	length, err := strconv.Atoi(setting.Value)
	if err != nil {
		s.logger.Error("failed to parse short_code_length", zap.String("value", setting.Value), zap.Error(err))
		return 6, err
	}

	// 验证长度范围
	if length < 3 || length > 20 {
		s.logger.Warn("invalid short_code_length, using default", zap.Int("length", length))
		return 6, nil
	}

	return length, nil
}

// UpdateShortCodeLength 更新短链接长度设置
func (s *settingsService) UpdateShortCodeLength(ctx context.Context, length int) error {
	// 验证长度范围
	if length < 3 || length > 20 {
		s.logger.Warn("invalid short_code_length", zap.Int("length", length))
		return domain.ErrInvalidShortCode
	}

	value := strconv.Itoa(length)
	if err := s.settingsRepo.Update(ctx, "short_code_length", value); err != nil {
		s.logger.Error("failed to update short_code_length", zap.Int("length", length), zap.Error(err))
		return err
	}

	s.logger.Info("short_code_length updated", zap.Int("length", length))
	return nil
}

// GetSystemSettings 获取系统设置
func (s *settingsService) GetSystemSettings(ctx context.Context) (*domain.SystemSettings, error) {
	length, err := s.GetShortCodeLength(ctx)
	if err != nil {
		return nil, err
	}

	return &domain.SystemSettings{
		ShortCodeLength: length,
	}, nil
}
