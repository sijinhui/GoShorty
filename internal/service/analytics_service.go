package service

import (
	"context"
	"time"

	"GoShorty/internal/domain"
	"GoShorty/internal/repository"
	"GoShorty/pkg/geolocation"

	"go.uber.org/zap"
)

// AnalyticsService 统计服务接口
type AnalyticsService interface {
	RecordAccess(ctx context.Context, linkID int64, ipAddress, userAgent, referer string) error
	GetAccessLogs(ctx context.Context, linkID int64, limit, offset int) ([]*domain.AccessLog, error)
	GetAccessLogCount(ctx context.Context, linkID int64) (int64, error)
	GetCountryStats(ctx context.Context, linkID int64) (map[string]int64, error)
}

// analyticsService 统计服务实现
type analyticsService struct {
	analyticsRepo repository.AnalyticsRepository
	geoResolver   geolocation.GeoIPResolver
	logger        *zap.Logger
}

// NewAnalyticsService 创建一个新的统计服务
func NewAnalyticsService(
	analyticsRepo repository.AnalyticsRepository,
	geoResolver geolocation.GeoIPResolver,
	logger *zap.Logger,
) AnalyticsService {
	return &analyticsService{
		analyticsRepo: analyticsRepo,
		geoResolver:   geoResolver,
		logger:        logger,
	}
}

// RecordAccess 记录访问日志
func (s *analyticsService) RecordAccess(ctx context.Context, linkID int64, ipAddress, userAgent, referer string) error {
	// 解析IP地址的地理位置
	location, err := s.geoResolver.Resolve(ipAddress)
	if err != nil {
		s.logger.Warn("Failed to resolve IP location", zap.String("ip", ipAddress), zap.Error(err))
		// 即使地理位置解析失败，也继续记录访问日志
		location = &geolocation.Location{
			Country: "Unknown",
			City:    "Unknown",
		}
	}

	// 创建访问日志
	var lat, lon *float64
	if location.Latitude != 0 || location.Longitude != 0 {
		lat = &location.Latitude
		lon = &location.Longitude
	}

	log := &domain.AccessLog{
		LinkID:     linkID,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		Referer:    referer,
		Country:    location.Country,
		City:       location.City,
		Latitude:   lat,
		Longitude:  lon,
		AccessedAt: time.Now(),
	}

	// 保存到数据库
	if err := s.analyticsRepo.CreateAccessLog(ctx, log); err != nil {
		s.logger.Error("Failed to create access log", zap.Error(err))
		return err
	}

	return nil
}

// GetAccessLogs 获取访问日志列表
func (s *analyticsService) GetAccessLogs(ctx context.Context, linkID int64, limit, offset int) ([]*domain.AccessLog, error) {
	return s.analyticsRepo.GetAccessLogsByLinkID(ctx, linkID, limit, offset)
}

// GetAccessLogCount 获取访问日志总数
func (s *analyticsService) GetAccessLogCount(ctx context.Context, linkID int64) (int64, error) {
	return s.analyticsRepo.GetAccessLogCount(ctx, linkID)
}

// GetCountryStats 获取按国家统计的访问数据
func (s *analyticsService) GetCountryStats(ctx context.Context, linkID int64) (map[string]int64, error) {
	return s.analyticsRepo.GetAccessLogsByCountry(ctx, linkID)
}
