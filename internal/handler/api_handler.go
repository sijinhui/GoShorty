package handler

import (
	"net/http"
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
	// 尝试从 X-Forwarded-For 头获取
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		// X-Forwarded-For 可能包含多个IP，取第一个
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// 尝试从 X-Real-IP 头获取
	if xri := c.GetHeader("X-Real-IP"); xri != "" {
		return xri
	}

	// 使用 RemoteAddr
	return c.ClientIP()
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
		c.JSON(http.StatusBadRequest, APIError{
			Success: false,
			Error:   "请填写原始链接",
			Code:    "INVALID_INPUT",
		})
		return
	}

	// 计算过期天数
	expiryDays := 0 // 默认不设置，让插件系统处理
	if req.ExpiresAt != "" {
		t, err := time.Parse("2006-01-02T15:04", req.ExpiresAt)
		if err == nil {
			days := int(time.Until(t).Hours() / 24)
			if days > 0 {
				expiryDays = days
			}
		}
	}

	// 获取客户端IP
	clientIP := getClientIP(c)

	// 创建链接请求
	createReq := &service.CreateLinkRequest{
		URL:        req.OriginalURL,
		CustomCode: req.ShortCode,
		Title:      req.Title,
		UserID:     1, // 简化版本，使用固定用户ID
		CreatedIP:  clientIP,
		ExpiryDays: expiryDays,
	}

	// 创建链接
	link, err := h.linkService.CreateLink(c.Request.Context(), createReq)
	if err != nil {
		h.logger.Error("Failed to create link", zap.Error(err))
		RespondError(c, err)
		return
	}

	// 构建短链接URL
	baseURL := c.Request.Host
	shortURL := "http://" + baseURL + "/" + link.ShortCode

	// 返回链接对象
	response := gin.H{
		"id":           link.ID,
		"short_code":   link.ShortCode,
		"original_url": link.OriginalURL,
		"short_url":    shortURL,
		"title":        link.Title,
		"created_at":   link.CreatedAt,
	}

	RespondSuccess(c, response, "短链接创建成功")
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
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, APIError{
			Success: false,
			Error:   "无效的链接ID",
			Code:    "INVALID_INPUT",
		})
		return
	}

	// 简化版本：使用固定用户ID，实际应该从session获取
	if err := h.linkService.DeleteLink(c.Request.Context(), id, 1); err != nil {
		h.logger.Error("Failed to delete link", zap.Error(err))
		RespondError(c, err)
		return
	}

	RespondSuccess(c, nil, "链接已删除")
}

// GetLinkAnalytics 获取链接统计数据
func (h *APIHandler) GetLinkAnalytics(c *gin.Context) {
	linkIDStr := c.Query("link_id")
	linkID, err := strconv.ParseInt(linkIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, APIError{
			Success: false,
			Error:   "无效的链接ID",
			Code:    "INVALID_INPUT",
		})
		return
	}

	// 获取链接信息
	link, err := h.linkService.GetByID(c.Request.Context(), linkID)
	if err != nil {
		RespondError(c, err)
		return
	}

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

	RespondSuccess(c, response, "")
}

// CreatePublicLink 公开创建短链接（不需要认证）
func (h *APIHandler) CreatePublicLink(c *gin.Context) {
	var req struct {
		OriginalURL string `json:"original_url" binding:"required"`
		ShortCode   string `json:"short_code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIError{
			Success: false,
			Error:   "请填写原始链接",
			Code:    "INVALID_INPUT",
		})
		return
	}

	// 获取客户端IP
	clientIP := getClientIP(c)

	// 创建链接请求（公开接口使用默认配置）
	createReq := &service.CreateLinkRequest{
		URL:        req.OriginalURL,
		CustomCode: req.ShortCode,
		Title:      "",
		UserID:     1, // 公开链接使用默认用户ID
		CreatedIP:  clientIP,
		ExpiryDays: 0, // 默认不设置，让插件系统处理
	}

	// 创建链接
	link, err := h.linkService.CreateLink(c.Request.Context(), createReq)
	if err != nil {
		h.logger.Error("Failed to create public link", zap.Error(err))
		RespondError(c, err)
		return
	}

	// 构建短链接URL
	baseURL := c.Request.Host
	shortURL := "http://" + baseURL + "/" + link.ShortCode

	// 返回链接对象
	response := gin.H{
		"id":           link.ID,
		"short_code":   link.ShortCode,
		"original_url": link.OriginalURL,
		"short_url":    shortURL,
		"created_at":   link.CreatedAt,
	}

	RespondSuccess(c, response, "短链接创建成功")
}
