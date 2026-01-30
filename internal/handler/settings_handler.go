package handler

import (
	"net/http"

	"GoShorty/internal/domain"
	"GoShorty/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// SettingsHandler 设置处理器
type SettingsHandler struct {
	settingsService service.SettingsService
	logger          *zap.Logger
}

// NewSettingsHandler 创建一个新的SettingsHandler
func NewSettingsHandler(
	settingsService service.SettingsService,
	logger *zap.Logger,
) *SettingsHandler {
	return &SettingsHandler{
		settingsService: settingsService,
		logger:          logger,
	}
}

// GetSettings 获取系统设置
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	settings, err := h.settingsService.GetSystemSettings(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get settings", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, settings, "")
}

// UpdateSettings 更新系统设置
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var req struct {
		ShortCodeLength int `json:"short_code_length" binding:"required,min=3,max=20"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIError{
			Success: false,
			Error:   "短链接长度必须在3-20之间",
			Code:    "INVALID_INPUT",
		})
		return
	}

	if err := h.settingsService.UpdateShortCodeLength(c.Request.Context(), req.ShortCodeLength); err != nil {
		h.logger.Error("Failed to update settings", zap.Int("length", req.ShortCodeLength), zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, gin.H{"short_code_length": req.ShortCodeLength}, "设置已更新")
}
