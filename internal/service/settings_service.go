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

	// 插件配置方法
	GetPluginConfig(ctx context.Context, pluginName, key string) (string, error)
	SetPluginConfig(ctx context.Context, pluginName, key, value string) error
	GetPluginEnabled(ctx context.Context, pluginName string) (bool, error)
	SetPluginEnabled(ctx context.Context, pluginName string, enabled bool) error
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

// GetPluginConfig 获取插件配置值
func (s *settingsService) GetPluginConfig(ctx context.Context, pluginName, key string) (string, error) {
	settingKey := "plugin." + pluginName + "." + key
	setting, err := s.settingsRepo.GetByKey(ctx, settingKey)
	if err != nil {
		s.logger.Error("failed to get plugin config",
			zap.String("plugin", pluginName),
			zap.String("key", key),
			zap.Error(err))
		return "", err
	}
	return setting.Value, nil
}

// SetPluginConfig 设置插件配置值
func (s *settingsService) SetPluginConfig(ctx context.Context, pluginName, key, value string) error {
	settingKey := "plugin." + pluginName + "." + key
	if err := s.settingsRepo.Update(ctx, settingKey, value); err != nil {
		s.logger.Error("failed to set plugin config",
			zap.String("plugin", pluginName),
			zap.String("key", key),
			zap.String("value", value),
			zap.Error(err))
		return err
	}
	s.logger.Info("plugin config updated",
		zap.String("plugin", pluginName),
		zap.String("key", key))
	return nil
}

// GetPluginEnabled 获取插件启用状态
func (s *settingsService) GetPluginEnabled(ctx context.Context, pluginName string) (bool, error) {
	value, err := s.GetPluginConfig(ctx, pluginName, "enabled")
	if err != nil {
		return false, err
	}

	enabled, err := strconv.ParseBool(value)
	if err != nil {
		s.logger.Error("failed to parse plugin enabled status",
			zap.String("plugin", pluginName),
			zap.String("value", value),
			zap.Error(err))
		return false, err
	}

	return enabled, nil
}

// SetPluginEnabled 设置插件启用状态
func (s *settingsService) SetPluginEnabled(ctx context.Context, pluginName string, enabled bool) error {
	value := strconv.FormatBool(enabled)
	return s.SetPluginConfig(ctx, pluginName, "enabled", value)
}
