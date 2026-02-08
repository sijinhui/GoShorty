package handler

import (
	"GoShorty/internal/domain"
	"GoShorty/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AdminHandler 管理后台处理器
type AdminHandler struct {
	authService service.AuthService
	linkService service.LinkService
	logger      *zap.Logger
}

// NewAdminHandler 创建一个新的AdminHandler
func NewAdminHandler(
	authService service.AuthService,
	linkService service.LinkService,
	logger *zap.Logger,
) *AdminHandler {
	return &AdminHandler{
		authService: authService,
		linkService: linkService,
		logger:      logger,
	}
}

// HandleAPILogin 处理JSON格式的登录请求
func (h *AdminHandler) HandleAPILogin(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondBadRequest(c, "请填写用户名和密码")
		return
	}

	sessionID, err := h.authService.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		RespondError(c, domain.ErrInvalidCredentials)
		return
	}

	c.SetCookie("session_id", sessionID, 86400, "/", "", false, true)

	RespondSuccess(c, gin.H{
		"session_id": sessionID,
	}, "登录成功")
}

// HandleCheckAuth 验证当前会话是否有效
func (h *AdminHandler) HandleCheckAuth(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		RespondError(c, domain.ErrUnauthorized)
		return
	}

	RespondSuccess(c, gin.H{
		"user_id": userID,
	}, "会话有效")
}

// HandleLogout 处理登出请求
func (h *AdminHandler) HandleLogout(c *gin.Context) {
	sessionID, err := c.Cookie("session_id")
	if err == nil {
		if err := h.authService.Logout(c.Request.Context(), sessionID); err != nil {
			h.logger.Error("logout failed", zap.Error(err))
		}
	}

	c.SetCookie("session_id", "", -1, "/", "", false, true)
	RespondSuccess(c, nil, "登出成功")
}
