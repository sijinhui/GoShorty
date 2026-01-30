package service

import (
	"context"
	"errors"
	"time"

	"GoShorty/internal/domain"
	"GoShorty/internal/plugin"
	"GoShorty/internal/repository"
	"GoShorty/pkg/validator"

	"go.uber.org/zap"
)

// LinkService 链接服务接口
type LinkService interface {
	CreateLink(ctx context.Context, req *CreateLinkRequest) (*domain.Link, error)
	GetByShortCode(ctx context.Context, shortCode string) (*domain.Link, error)
	GetByID(ctx context.Context, id int64) (*domain.Link, error)
	UpdateLink(ctx context.Context, req *UpdateLinkRequest) error
	DeleteLink(ctx context.Context, id int64, userID int) error
	ListLinks(ctx context.Context, limit, offset int) ([]*domain.Link, error)
	IncrementClickCount(ctx context.Context, id int64) error
	GetDashboardStats(ctx context.Context) (map[string]interface{}, error)
}

// CreateLinkRequest 创建链接请求
type CreateLinkRequest struct {
	URL        string
	CustomCode string
	Title      string
	UserID     int
	ExpiryDays int
}

// UpdateLinkRequest 更新链接请求
type UpdateLinkRequest struct {
	ID        int64
	URL       string
	Title     string
	ExpiresAt *time.Time
	IsActive  bool
	UserID    int
}

// linkService 链接服务实现
type linkService struct {
	linkRepo      repository.LinkRepository
	codeGenerator ShortCodeGenerator
	hooks         *plugin.Hooks
	logger        *zap.Logger
}

// NewLinkService 创建一个新的链接服务
func NewLinkService(
	linkRepo repository.LinkRepository,
	codeGenerator ShortCodeGenerator,
	hooks *plugin.Hooks,
	logger *zap.Logger,
) LinkService {
	return &linkService{
		linkRepo:      linkRepo,
		codeGenerator: codeGenerator,
		hooks:         hooks,
		logger:        logger,
	}
}

// CreateLink 创建一个新的短链接
func (s *linkService) CreateLink(ctx context.Context, req *CreateLinkRequest) (*domain.Link, error) {
	// 验证URL
	normalizedURL := validator.NormalizeURL(req.URL)
	if err := validator.ValidateURL(normalizedURL); err != nil {
		s.logger.Error("invalid URL", zap.String("url", req.URL), zap.Error(err))
		return nil, domain.ErrInvalidURL
	}

	// 生成或验证短码
	var shortCode string
	var isCustom bool

	if req.CustomCode != "" {
		// 使用自定义短码
		if err := s.codeGenerator.Validate(req.CustomCode); err != nil {
			s.logger.Error("invalid custom code", zap.String("code", req.CustomCode), zap.Error(err))
			// 检查是否是黑名单错误
			if errors.Is(err, ErrShortCodeBlacklisted) {
				return nil, domain.ErrShortCodeBlacklisted
			}
			return nil, domain.ErrInvalidShortCode
		}

		// 检查短码是否已存在
		exists, err := s.linkRepo.ExistsShortCode(ctx, req.CustomCode)
		if err != nil {
			s.logger.Error("failed to check short code existence", zap.Error(err))
			return nil, err
		}
		if exists {
			return nil, domain.ErrShortCodeExists
		}

		shortCode = req.CustomCode
		isCustom = true
	} else {
		// 自动生成短码
		var err error
		for i := 0; i < 5; i++ { // 最多尝试5次
			shortCode, err = s.codeGenerator.Generate()
			if err != nil {
				s.logger.Error("failed to generate short code", zap.Error(err))
				return nil, err
			}

			// 检查是否已存在
			exists, err := s.linkRepo.ExistsShortCode(ctx, shortCode)
			if err != nil {
				s.logger.Error("failed to check short code existence", zap.Error(err))
				return nil, err
			}
			if !exists {
				break
			}
		}
		isCustom = false
	}

	// 计算过期时间
	var expiresAt *time.Time
	if req.ExpiryDays > 0 {
		expiry := time.Now().AddDate(0, 0, req.ExpiryDays)
		expiresAt = &expiry
	}

	// 创建链接对象
	link := &domain.Link{
		ShortCode:   shortCode,
		OriginalURL: normalizedURL,
		Title:       req.Title,
		UserID:      req.UserID,
		ExpiresAt:   expiresAt,
		IsActive:    true,
		CustomCode:  isCustom,
		Metadata:    make(map[string]interface{}),
	}

	// 使用插件计算过期时间（如果没有指定过期时间）
	if s.hooks != nil && expiresAt == nil {
		pluginExpiry, err := s.hooks.CalculateExpiry(ctx, link)
		if err != nil {
			s.logger.Warn("plugin expiry calculation failed", zap.Error(err))
		} else if pluginExpiry != nil {
			link.ExpiresAt = pluginExpiry
		}
	}

	// 执行创建前钩子
	if s.hooks != nil {
		if err := s.hooks.ExecuteBeforeCreate(ctx, link); err != nil {
			s.logger.Error("before create hook failed", zap.Error(err))
			return nil, err
		}
	}

	// 保存到数据库
	if err := s.linkRepo.Create(ctx, link); err != nil {
		s.logger.Error("failed to create link", zap.Error(err))
		return nil, err
	}

	// 执行创建后钩子
	if s.hooks != nil {
		if err := s.hooks.ExecuteAfterCreate(ctx, link); err != nil {
			s.logger.Warn("after create hook failed", zap.Error(err))
		}
	}

	s.logger.Info("link created",
		zap.Int64("id", link.ID),
		zap.String("short_code", link.ShortCode),
		zap.String("url", link.OriginalURL),
	)

	return link, nil
}

// GetByShortCode 根据短码获取链接
func (s *linkService) GetByShortCode(ctx context.Context, shortCode string) (*domain.Link, error) {
	link, err := s.linkRepo.GetByShortCode(ctx, shortCode)
	if err != nil {
		return nil, err
	}

	// 检查链接是否有效
	if !link.IsValid() {
		if link.IsExpired() {
			return nil, domain.ErrLinkExpired
		}
		return nil, domain.ErrLinkInactive
	}

	return link, nil
}

// GetByID 根据ID获取链接
func (s *linkService) GetByID(ctx context.Context, id int64) (*domain.Link, error) {
	return s.linkRepo.GetByID(ctx, id)
}

// UpdateLink 更新链接
func (s *linkService) UpdateLink(ctx context.Context, req *UpdateLinkRequest) error {
	// 获取现有链接
	link, err := s.linkRepo.GetByID(ctx, req.ID)
	if err != nil {
		return err
	}

	// 检查权限
	if link.UserID != req.UserID {
		return domain.ErrForbidden
	}

	// 验证URL
	if req.URL != "" {
		normalizedURL := validator.NormalizeURL(req.URL)
		if err := validator.ValidateURL(normalizedURL); err != nil {
			return domain.ErrInvalidURL
		}
		link.OriginalURL = normalizedURL
	}

	// 更新字段
	if req.Title != "" {
		link.Title = req.Title
	}
	if req.ExpiresAt != nil {
		link.ExpiresAt = req.ExpiresAt
	}
	link.IsActive = req.IsActive

	// 保存更新
	if err := s.linkRepo.Update(ctx, link); err != nil {
		s.logger.Error("failed to update link", zap.Int64("id", req.ID), zap.Error(err))
		return err
	}

	s.logger.Info("link updated", zap.Int64("id", req.ID))
	return nil
}

// DeleteLink 删除链接
func (s *linkService) DeleteLink(ctx context.Context, id int64, userID int) error {
	// 获取链接以检查权限
	link, err := s.linkRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// 检查权限
	if link.UserID != userID {
		return domain.ErrForbidden
	}

	// 删除链接
	if err := s.linkRepo.Delete(ctx, id); err != nil {
		s.logger.Error("failed to delete link", zap.Int64("id", id), zap.Error(err))
		return err
	}

	s.logger.Info("link deleted", zap.Int64("id", id))
	return nil
}

// ListLinks 获取链接列表
func (s *linkService) ListLinks(ctx context.Context, limit, offset int) ([]*domain.Link, error) {
	return s.linkRepo.List(ctx, limit, offset)
}

// IncrementClickCount 增加点击计数
func (s *linkService) IncrementClickCount(ctx context.Context, id int64) error {
	return s.linkRepo.IncrementClickCount(ctx, id)
}

// GetDashboardStats 获取仪表盘统计数据
func (s *linkService) GetDashboardStats(ctx context.Context) (map[string]interface{}, error) {
	// 获取所有链接（简化版本，实际应该使用专门的统计查询）
	links, err := s.linkRepo.List(ctx, 10000, 0)
	if err != nil {
		return nil, err
	}

	totalLinks := len(links)
	activeLinks := 0
	totalClicks := 0
	todayClicks := 0

	today := time.Now().Truncate(24 * time.Hour)

	for _, link := range links {
		if link.IsActive && !link.IsExpired() {
			activeLinks++
		}
		totalClicks += link.ClickCount

		// 简化版本：假设LastClickedAt在今天就算今日点击
		// 实际应该查询access_logs表
		if link.LastClickedAt != nil && link.LastClickedAt.After(today) {
			todayClicks += link.ClickCount
		}
	}

	return map[string]interface{}{
		"total_links":  totalLinks,
		"active_links": activeLinks,
		"today_clicks": todayClicks,
		"total_clicks": totalClicks,
	}, nil
}
