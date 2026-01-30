package service

import (
	"context"
	"time"

	"GoShorty/internal/domain"
	"GoShorty/internal/repository"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// AuthService 认证服务接口
type AuthService interface {
	Login(ctx context.Context, username, password string) (string, error)
	Logout(ctx context.Context, sessionID string) error
	ValidateSession(ctx context.Context, sessionID string) (*domain.Session, error)
	CreateUser(ctx context.Context, username, password, email string) error
}

// authService 认证服务实现
type authService struct {
	userRepo    repository.UserRepository
	sessionRepo repository.SessionRepository
	sessionTTL  time.Duration
	logger      *zap.Logger
}

// NewAuthService 创建一个新的认证服务
func NewAuthService(
	userRepo repository.UserRepository,
	sessionRepo repository.SessionRepository,
	sessionTTL time.Duration,
	logger *zap.Logger,
) AuthService {
	return &authService{
		userRepo:    userRepo,
		sessionRepo: sessionRepo,
		sessionTTL:  sessionTTL,
		logger:      logger,
	}
}

// Login 用户登录
func (s *authService) Login(ctx context.Context, username, password string) (string, error) {
	// 获取用户
	user, err := s.userRepo.GetByUsername(ctx, username)
	if err != nil {
		s.logger.Warn("login failed: user not found", zap.String("username", username))
		return "", domain.ErrInvalidCredentials
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		s.logger.Warn("login failed: invalid password", zap.String("username", username))
		return "", domain.ErrInvalidCredentials
	}

	// 创建会话
	sessionID := uuid.New().String()
	session := &domain.Session{
		ID:        sessionID,
		UserID:    user.ID,
		Data:      make(map[string]interface{}),
		ExpiresAt: time.Now().Add(s.sessionTTL),
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		s.logger.Error("failed to create session", zap.Error(err))
		return "", err
	}

	s.logger.Info("user logged in", zap.String("username", username), zap.Int("user_id", user.ID))
	return sessionID, nil
}

// Logout 用户登出
func (s *authService) Logout(ctx context.Context, sessionID string) error {
	if err := s.sessionRepo.Delete(ctx, sessionID); err != nil {
		s.logger.Error("failed to delete session", zap.String("session_id", sessionID), zap.Error(err))
		return err
	}

	s.logger.Info("user logged out", zap.String("session_id", sessionID))
	return nil
}

// ValidateSession 验证会话
func (s *authService) ValidateSession(ctx context.Context, sessionID string) (*domain.Session, error) {
	session, err := s.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	// 检查会话是否过期
	if session.IsExpired() {
		// 删除过期会话
		_ = s.sessionRepo.Delete(ctx, sessionID)
		return nil, domain.ErrSessionExpired
	}

	return session, nil
}

// CreateUser 创建新用户
func (s *authService) CreateUser(ctx context.Context, username, password, email string) error {
	// 生成密码哈希
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		s.logger.Error("failed to hash password", zap.Error(err))
		return err
	}

	user := &domain.User{
		Username:     username,
		PasswordHash: string(passwordHash),
		Email:        email,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		s.logger.Error("failed to create user", zap.String("username", username), zap.Error(err))
		return err
	}

	s.logger.Info("user created", zap.String("username", username), zap.Int("user_id", user.ID))
	return nil
}

