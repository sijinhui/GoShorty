package handler

import (
	"net/http"

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
		c.JSON(http.StatusBadRequest, APIError{
			Success: false,
			Error:   "请填写用户名和密码",
			Code:    "INVALID_INPUT",
		})
		return
	}

	// 验证登录
	sessionID, err := h.authService.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, APIError{
			Success: false,
			Error:   "用户名或密码错误",
			Code:    "INVALID_CREDENTIALS",
		})
		return
	}

	// 设置Cookie
	c.SetCookie("session_id", sessionID, 86400, "/", "", false, true)

	// 返回JSON响应
	RespondSuccess(c, gin.H{
		"session_id": sessionID,
	}, "登录成功")
}

