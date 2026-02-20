package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"GoShorty/internal/domain"
	"GoShorty/internal/repository"

	"go.uber.org/zap"
)

const (
	apiKeyPrefix = "gs-"
	apiKeyLength = 48 // 生成48字节随机数据，base16编码后96字符
)

// ApiKeyService API密钥服务接口
type ApiKeyService interface {
	GenerateKey(ctx context.Context, name string, userID int) (string, *domain.ApiKey, error)
	ValidateKey(ctx context.Context, rawKey string) (*domain.ApiKey, error)
	ListKeys(ctx context.Context, userID int) ([]*domain.ApiKey, error)
	RevokeKey(ctx context.Context, id int, userID int) error
	DeleteKey(ctx context.Context, id int, userID int) error
}

type apiKeyService struct {
	repo   repository.ApiKeyRepository
	logger *zap.Logger
}

// NewApiKeyService 创建一个新的API密钥服务
func NewApiKeyService(repo repository.ApiKeyRepository, logger *zap.Logger) ApiKeyService {
	return &apiKeyService{repo: repo, logger: logger}
}

// GenerateKey 生成一个新的API密钥，返回明文密钥（仅此一次）和密钥记录
func (s *apiKeyService) GenerateKey(ctx context.Context, name string, userID int) (string, *domain.ApiKey, error) {
	// 生成随机字节
	randomBytes := make([]byte, apiKeyLength)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", nil, fmt.Errorf("failed to generate random bytes: %w", err)
	}

	rawKey := apiKeyPrefix + hex.EncodeToString(randomBytes)
	keyHash := hashKey(rawKey)
	keyPrefix := rawKey[:len(apiKeyPrefix)+8] + "..."

	apiKey := &domain.ApiKey{
		KeyHash:  keyHash,
		KeyPrefix: keyPrefix,
		Name:     name,
		UserID:   userID,
		IsActive: true,
	}

	if err := s.repo.Create(ctx, apiKey); err != nil {
		s.logger.Error("failed to create api key", zap.Error(err))
		return "", nil, err
	}

	s.logger.Info("api key created", zap.String("name", name), zap.Int("user_id", userID))
	return rawKey, apiKey, nil
}

// ValidateKey 验证API密钥，返回密钥记录
func (s *apiKeyService) ValidateKey(ctx context.Context, rawKey string) (*domain.ApiKey, error) {
	keyHash := hashKey(rawKey)
	apiKey, err := s.repo.GetByKeyHash(ctx, keyHash)
	if err != nil {
		return nil, err
	}

	if !apiKey.IsActive {
		return nil, domain.ErrApiKeyExpired
	}

	// 异步更新最后使用时间
	go func() {
		if err := s.repo.UpdateLastUsed(context.Background(), apiKey.ID); err != nil {
			s.logger.Error("failed to update api key last used", zap.Error(err))
		}
	}()

	return apiKey, nil
}

// ListKeys 列出用户的所有API密钥
func (s *apiKeyService) ListKeys(ctx context.Context, userID int) ([]*domain.ApiKey, error) {
	return s.repo.List(ctx, userID)
}

// RevokeKey 吊销API密钥
func (s *apiKeyService) RevokeKey(ctx context.Context, id int, userID int) error {
	return s.repo.Revoke(ctx, id, userID)
}

// DeleteKey 删除API密钥
func (s *apiKeyService) DeleteKey(ctx context.Context, id int, userID int) error {
	return s.repo.Delete(ctx, id, userID)
}

// hashKey 对原始密钥进行SHA-256哈希
func hashKey(rawKey string) string {
	h := sha256.Sum256([]byte(rawKey))
	return hex.EncodeToString(h[:])
}