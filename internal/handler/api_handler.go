package handler

import (
	"net/http"
	"strconv"
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

// GetDashboardStats 获取仪表盘统计数据
func (h *APIHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.linkService.GetDashboardStats(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get dashboard stats", zap.Error(err))
		c.HTML(http.StatusInternalServerError, "components/error.html", gin.H{
			"error": "获取统计数据失败",
		})
		return
	}

	c.HTML(http.StatusOK, "components/stats_cards.html", gin.H{
		"stats": stats,
	})
}

// CreateLink 创建短链接
func (h *APIHandler) CreateLink(c *gin.Context) {
	var req struct {
		OriginalURL string `form:"original_url" binding:"required"`
		ShortCode   string `form:"short_code"`
		Title       string `form:"title"`
		ExpiresAt   string `form:"expires_at"`
	}

	if err := c.ShouldBind(&req); err != nil {
		c.HTML(http.StatusBadRequest, "components/alert.html", gin.H{
			"type":    "error",
			"message": "请填写原始链接",
		})
		return
	}

	// 计算过期天数
	expiryDays := 7 // 默认7天
	if req.ExpiresAt != "" {
		t, err := time.Parse("2006-01-02T15:04", req.ExpiresAt)
		if err == nil {
			days := int(time.Until(t).Hours() / 24)
			if days > 0 {
				expiryDays = days
			}
		}
	}

	// 创建链接请求
	createReq := &service.CreateLinkRequest{
		URL:        req.OriginalURL,
		CustomCode: req.ShortCode,
		Title:      req.Title,
		UserID:     1, // 简化版本，使用固定用户ID
		ExpiryDays: expiryDays,
	}

	// 创建链接
	link, err := h.linkService.CreateLink(c.Request.Context(), createReq)
	if err != nil {
		h.logger.Error("Failed to create link", zap.Error(err))
		c.HTML(http.StatusBadRequest, "components/alert.html", gin.H{
			"type":    "error",
			"message": err.Error(),
		})
		return
	}

	// 返回成功消息
	baseURL := c.Request.Host
	shortURL := "http://" + baseURL + "/" + link.ShortCode

	c.HTML(http.StatusOK, "components/alert.html", gin.H{
		"type":      "success",
		"message":   "短链接创建成功！",
		"short_url": shortURL,
	})
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

	// 获取链接列表（userID=0表示获取所有用户的链接）
	links, err := h.linkService.ListLinks(c.Request.Context(), 0, limit, offset)
	if err != nil {
		h.logger.Error("Failed to get links", zap.Error(err))
		c.HTML(http.StatusInternalServerError, "components/error.html", gin.H{
			"error": "获取链接列表失败",
		})
		return
	}

	// 计算分页信息
	total := len(links) // 简化版本，实际应该查询总数
	hasNext := len(links) == limit
	hasPrev := page > 1

	c.HTML(http.StatusOK, "components/links_table.html", gin.H{
		"links": links,
		"pagination": gin.H{
			"page":      page,
			"limit":     limit,
			"offset":    offset + 1,
			"end":       offset + len(links),
			"total":     total,
			"has_next":  hasNext,
			"has_prev":  hasPrev,
			"next_page": page + 1,
			"prev_page": page - 1,
		},
	})
}

// DeleteLink 删除链接
func (h *APIHandler) DeleteLink(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}

	// 简化版本：使用固定用户ID，实际应该从session获取
	if err := h.linkService.DeleteLink(c.Request.Context(), id, 1); err != nil {
		h.logger.Error("Failed to delete link", zap.Error(err))
		c.Status(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

// GetLinkAnalytics 获取链接统计数据
func (h *APIHandler) GetLinkAnalytics(c *gin.Context) {
	linkIDStr := c.Query("link_id")
	linkID, err := strconv.ParseInt(linkIDStr, 10, 64)
	if err != nil {
		c.HTML(http.StatusBadRequest, "components/error.html", gin.H{
			"error": "无效的链接ID",
		})
		return
	}

	// 获取链接信息
	link, err := h.linkService.GetByID(c.Request.Context(), linkID)
	if err != nil {
		c.HTML(http.StatusNotFound, "components/error.html", gin.H{
			"error": "链接不存在",
		})
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

	c.HTML(http.StatusOK, "components/analytics_detail.html", gin.H{
		"link":          link,
		"logs":          logs,
		"country_stats": countryStats,
	})
}
