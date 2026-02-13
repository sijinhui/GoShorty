package handler

import (
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
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 50
	}

	offset, err := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err != nil || offset < 0 {
		offset = 0
	}

	expiries, err := h.linkExpiryService.ListExpired(c.Request.Context(), limit, offset)
	if err != nil {
		h.logger.Error("failed to list expired links", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

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
		RespondBadRequest(c, "短码不能为空")
		return
	}

	if err := h.linkExpiryService.DeleteExpired(c.Request.Context(), shortCode); err != nil {
		h.logger.Error("failed to delete expired link",
			zap.String("short_code", shortCode),
			zap.Error(err),
		)
		RespondError(c, err)
		return
	}

	RespondSuccess(c, nil, "删除成功")
}

// HandleDeleteAllExpired 批量删除所有已过期记录
func (h *LinkExpiryHandler) HandleDeleteAllExpired(c *gin.Context) {
	count, err := h.linkExpiryService.DeleteAllExpired(c.Request.Context())
	if err != nil {
		h.logger.Error("failed to delete all expired links", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, gin.H{
		"deleted_count": count,
	}, "批量删除成功")
}

// HandleBatchDeleteExpired 批量删除选中的过期记录
func (h *LinkExpiryHandler) HandleBatchDeleteExpired(c *gin.Context) {
	var req struct {
		ShortCodes []string `json:"short_codes" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondError(c, domain.ErrInternalServer)
		return
	}

	if len(req.ShortCodes) == 0 {
		RespondError(c, domain.ErrInternalServer)
		return
	}

	count, err := h.linkExpiryService.BatchDeleteExpired(c.Request.Context(), req.ShortCodes)
	if err != nil {
		h.logger.Error("failed to batch delete expired links", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, gin.H{
		"deleted_count": count,
	}, "批量删除成功")
}

// HandleCancelExpiry 取消链接的过期设置
func (h *LinkExpiryHandler) HandleCancelExpiry(c *gin.Context) {
	shortCode := c.Param("shortCode")
	if shortCode == "" {
		RespondBadRequest(c, "短码不能为空")
		return
	}

	if err := h.linkExpiryService.CancelExpiry(c.Request.Context(), shortCode); err != nil {
		h.logger.Error("failed to cancel expiry",
			zap.String("short_code", shortCode),
			zap.Error(err),
		)
		RespondError(c, err)
		return
	}

	RespondSuccess(c, nil, "已取消过期设置")
}
