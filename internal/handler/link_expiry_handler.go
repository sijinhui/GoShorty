package handler

import (
	"net/http"
	"strconv"

	"GoShorty/internal/domain"
	"GoShorty/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// LinkExpiryHandler 链接过期管理处理器
type LinkExpiryHandler struct {
	linkExpiryService service.LinkExpiryService
	logger            *zap.Logger
}

// NewLinkExpiryHandler 创建一个新的LinkExpiryHandler
func NewLinkExpiryHandler(
	linkExpiryService service.LinkExpiryService,
	logger *zap.Logger,
) *LinkExpiryHandler {
	return &LinkExpiryHandler{
		linkExpiryService: linkExpiryService,
		logger:            logger,
	}
}

// HandleListExpired 获取已过期链接列表
func (h *LinkExpiryHandler) HandleListExpired(c *gin.Context) {
	// 获取分页参数
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// 获取已过期链接列表
	expiries, err := h.linkExpiryService.ListExpired(c.Request.Context(), limit, offset)
	if err != nil {
		h.logger.Error("failed to list expired links", zap.Error(err))
		c.JSON(http.StatusInternalServerError, APIError{
			Success: false,
			Error:   "获取过期链接列表失败",
			Code:    "INTERNAL_ERROR",
		})
		return
	}

	// 获取总数
	count, err := h.linkExpiryService.GetExpiredCount(c.Request.Context())
	if err != nil {
		h.logger.Error("failed to get expired count", zap.Error(err))
		count = 0
	}

	RespondSuccess(c, gin.H{
		"expiries": expiries,
		"total":    count,
		"limit":    limit,
		"offset":   offset,
	}, "获取成功")
}

// HandleDeleteExpired 删除单个过期记录
func (h *LinkExpiryHandler) HandleDeleteExpired(c *gin.Context) {
	shortCode := c.Param("shortCode")
	if shortCode == "" {
		c.JSON(http.StatusBadRequest, APIError{
			Success: false,
			Error:   "短码不能为空",
			Code:    "INVALID_INPUT",
		})
		return
	}

	// 删除过期记录
	err := h.linkExpiryService.DeleteExpired(c.Request.Context(), shortCode)
	if err != nil {
		h.logger.Error("failed to delete expired link",
			zap.String("short_code", shortCode),
			zap.Error(err),
		)

		// 根据错误类型返回不同的响应
		if err == domain.ErrLinkNotExpired {
			c.JSON(http.StatusBadRequest, APIError{
				Success: false,
				Error:   "链接尚未过期，无法删除",
				Code:    "LINK_NOT_EXPIRED",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, APIError{
			Success: false,
			Error:   "删除过期记录失败",
			Code:    "INTERNAL_ERROR",
		})
		return
	}

	RespondSuccess(c, nil, "删除成功")
}

// HandleDeleteAllExpired 批量删除所有已过期记录
func (h *LinkExpiryHandler) HandleDeleteAllExpired(c *gin.Context) {
	// 删除所有已过期记录
	count, err := h.linkExpiryService.DeleteAllExpired(c.Request.Context())
	if err != nil {
		h.logger.Error("failed to delete all expired links", zap.Error(err))
		c.JSON(http.StatusInternalServerError, APIError{
			Success: false,
			Error:   "批量删除失败",
			Code:    "INTERNAL_ERROR",
		})
		return
	}

	RespondSuccess(c, gin.H{
		"deleted_count": count,
	}, "批量删除成功")
}
