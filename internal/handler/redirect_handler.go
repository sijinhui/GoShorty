package handler

import (
	"context"
	"net/http"

	"GoShorty/internal/domain"
	"GoShorty/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// RedirectHandler 处理短链接重定向
type RedirectHandler struct {
	linkService      service.LinkService
	analyticsService service.AnalyticsService
	logger           *zap.Logger
}

// NewRedirectHandler 创建一个新的RedirectHandler
func NewRedirectHandler(
	linkService service.LinkService,
	analyticsService service.AnalyticsService,
	logger *zap.Logger,
) *RedirectHandler {
	return &RedirectHandler{
		linkService:      linkService,
		analyticsService: analyticsService,
		logger:           logger,
	}
}

// HandleRedirect 处理短链接重定向请求
func (h *RedirectHandler) HandleRedirect(c *gin.Context) {
	shortCode := c.Param("code")

	// 查询短链接
	link, err := h.linkService.GetByShortCode(c.Request.Context(), shortCode)
	if err != nil {
		h.handleError(c, err)
		return
	}

	// 异步更新点击计数
	go func() {
		ctx := context.Background()
		if err := h.linkService.IncrementClickCount(ctx, link.ID); err != nil {
			h.logger.Error("failed to increment click count",
				zap.Int64("link_id", link.ID),
				zap.Error(err),
			)
		}
	}()

	// 异步记录访问日志
	go func() {
		ctx := context.Background()
		if err := h.analyticsService.RecordAccess(
			ctx,
			link.ID,
			c.ClientIP(),
			c.Request.UserAgent(),
			c.Request.Referer(),
		); err != nil {
			h.logger.Error("failed to record access log",
				zap.Int64("link_id", link.ID),
				zap.Error(err),
			)
		}
	}()

	// 记录访问日志
	h.logger.Info("redirect",
		zap.String("short_code", shortCode),
		zap.String("url", link.OriginalURL),
		zap.String("ip", c.ClientIP()),
	)

	// 302临时重定向（方便统计点击）
	c.Redirect(http.StatusFound, link.OriginalURL)
}

// handleError 处理错误响应
func (h *RedirectHandler) handleError(c *gin.Context, err error) {
	switch err {
	case domain.ErrLinkNotFound:
		c.HTML(http.StatusNotFound, "404.html", gin.H{
			"message": "短链接不存在",
		})
	case domain.ErrLinkExpired:
		c.HTML(http.StatusGone, "410.html", gin.H{
			"message": "短链接已过期",
		})
	case domain.ErrLinkInactive:
		c.HTML(http.StatusGone, "410.html", gin.H{
			"message": "短链接已被禁用",
		})
	default:
		h.logger.Error("redirect error", zap.Error(err))
		c.HTML(http.StatusInternalServerError, "500.html", gin.H{
			"message": "服务器内部错误",
		})
	}
}
