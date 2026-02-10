package handler

import (
	"strconv"
	"strings"
	"time"

	"GoShorty/internal/domain"
	"GoShorty/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// APIHandler API处理器
type APIHandler struct {
	linkService      service.LinkService
	analyticsService service.AnalyticsService
	logger           *zap.Logger
}

// NewAPIHandler 创建一个新的APIHandler
func NewAPIHandler(
	linkService service.LinkService,
	analyticsService service.AnalyticsService,
	logger *zap.Logger,
) *APIHandler {
	return &APIHandler{
		linkService:      linkService,
		analyticsService: analyticsService,
		logger:           logger,
	}
}

// getClientIP 从请求中获取客户端IP地址
func getClientIP(c *gin.Context) string {
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.SplitN(xff, ",", 2)[0])
	}
	if xri := c.GetHeader("X-Real-IP"); xri != "" {
		return xri
	}
	return c.ClientIP()
}

// buildShortURL 构建完整的短链接URL
func buildShortURL(c *gin.Context, shortCode string) string {
	return "http://" + c.Request.Host + "/" + shortCode
}

// linkResponse 构建链接创建的响应数据
func linkResponse(c *gin.Context, link *domain.Link) gin.H {
	return gin.H{
		"id":           link.ID,
		"short_code":   link.ShortCode,
		"original_url": link.OriginalURL,
		"short_url":    buildShortURL(c, link.ShortCode),
		"title":        link.Title,
		"created_at":   link.CreatedAt,
	}
}

// GetDashboardStats 获取仪表盘统计数据
func (h *APIHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.linkService.GetDashboardStats(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get dashboard stats", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, stats, "")
}

// CreateLink 创建短链接
func (h *APIHandler) CreateLink(c *gin.Context) {
	var req struct {
		OriginalURL string `json:"original_url" binding:"required"`
		ShortCode   string `json:"short_code"`
		Title       string `json:"title"`
		ExpiresAt   string `json:"expires_at"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondBadRequest(c, "请填写原始链接")
		return
	}

	// 计算过期天数
	expiryDays := 0
	if req.ExpiresAt != "" {
		t, err := time.Parse("2006-01-02T15:04", req.ExpiresAt)
		if err == nil {
			if days := int(time.Until(t).Hours() / 24); days > 0 {
				expiryDays = days
			}
		}
	}

	h.logger.Info("creating link via API",
		zap.String("url", req.OriginalURL),
		zap.String("expires_at", req.ExpiresAt),
		zap.Int("expiry_days", expiryDays),
	)

	link, err := h.linkService.CreateLink(c.Request.Context(), &service.CreateLinkRequest{
		URL:        req.OriginalURL,
		CustomCode: req.ShortCode,
		Title:      req.Title,
		UserID:     1,
		CreatedIP:  getClientIP(c),
		ExpiryDays: expiryDays,
	})
	if err != nil {
		h.logger.Error("Failed to create link", zap.Error(err))
		RespondError(c, err)
		return
	}

	RespondSuccess(c, linkResponse(c, link), "短链接创建成功")
}

// GetLinks 获取链接列表
func (h *APIHandler) GetLinks(c *gin.Context) {
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	// 获取链接列表
	links, err := h.linkService.ListLinks(c.Request.Context(), limit, offset)
	if err != nil {
		h.logger.Error("Failed to get links", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	// 计算分页信息
	total := int64(len(links)) // 简化版本，实际应该查询总数
	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}
	hasNext := len(links) == limit
	hasPrev := page > 1

	pagination := PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    hasNext,
		HasPrev:    hasPrev,
	}

	RespondPaginated(c, links, pagination)
}

// DeleteLink 删除链接
func (h *APIHandler) DeleteLink(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		RespondBadRequest(c, "无效的链接ID")
		return
	}

	if err := h.linkService.DeleteLink(c.Request.Context(), id, 1); err != nil {
		h.logger.Error("Failed to delete link", zap.Error(err))
		RespondError(c, err)
		return
	}

	RespondSuccess(c, nil, "链接已删除")
}

// GetLinkAnalytics 获取链接统计数据
func (h *APIHandler) GetLinkAnalytics(c *gin.Context) {
	linkID, err := strconv.ParseInt(c.Query("link_id"), 10, 64)
	if err != nil {
		RespondBadRequest(c, "无效的链接ID")
		return
	}

	// 获取链接信息
	link, err := h.linkService.GetByID(c.Request.Context(), linkID)
	if err != nil {
		RespondError(c, err)
		return
	}

	RespondSuccess(c, h.buildAnalyticsResponse(c, link), "")
}

// GetLinkAnalyticsByShortCode 通过短码获取链接统计数据
func (h *APIHandler) GetLinkAnalyticsByShortCode(c *gin.Context) {
	shortCode := strings.TrimSpace(c.Param("shortCode"))
	shortCode = strings.TrimSuffix(shortCode, "+")
	if shortCode == "" {
		RespondBadRequest(c, "无效的短码")
		return
	}

	link, err := h.linkService.GetByShortCode(c.Request.Context(), shortCode)
	if err != nil {
		RespondError(c, err)
		return
	}

	RespondSuccess(c, h.buildAnalyticsResponse(c, link), "")
}

func (h *APIHandler) buildAnalyticsResponse(c *gin.Context, link *domain.Link) gin.H {
	linkID := link.ID

	// 获取访问日志
	logs, err := h.analyticsService.GetAccessLogs(c.Request.Context(), linkID, 50, 0)
	if err != nil {
		h.logger.Error("Failed to get access logs", zap.Error(err))
		logs = []*domain.AccessLog{}
	}

	// 获取国家统计
	countryStats, err := h.analyticsService.GetCountryStats(c.Request.Context(), linkID)
	if err != nil {
		h.logger.Error("Failed to get country stats", zap.Error(err))
		countryStats = make(map[string]int64)
	}

	// 返回JSON格式的统计数据
	response := gin.H{
		"link":          link,
		"access_logs":   logs,
		"country_stats": countryStats,
	}

	return response
}

// CreatePublicLink 公开创建短链接（不需要认证）
func (h *APIHandler) CreatePublicLink(c *gin.Context) {
	var req struct {
		OriginalURL string `json:"original_url" binding:"required"`
		ShortCode   string `json:"short_code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondBadRequest(c, "请填写原始链接")
		return
	}

	link, err := h.linkService.CreateLink(c.Request.Context(), &service.CreateLinkRequest{
		URL:        req.OriginalURL,
		CustomCode: req.ShortCode,
		UserID:     1,
		CreatedIP:  getClientIP(c),
	})
	if err != nil {
		h.logger.Error("Failed to create public link", zap.Error(err))
		RespondError(c, err)
		return
	}

	RespondSuccess(c, linkResponse(c, link), "短链接创建成功")
}
