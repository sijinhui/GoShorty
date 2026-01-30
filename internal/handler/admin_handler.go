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

// HandleCheckAuth 验证当前会话是否有效
func (h *AdminHandler) HandleCheckAuth(c *gin.Context) {
	// 从context中获取user_id（由认证中间件设置）
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, APIError{
			Success: false,
			Error:   "未授权访问",
			Code:    "UNAUTHORIZED",
		})
		return
	}

	// 返回成功响应
	RespondSuccess(c, gin.H{
		"user_id": userID,
	}, "会话有效")
}

// HandleLogout 处理登出请求
func (h *AdminHandler) HandleLogout(c *gin.Context) {
	// 从Cookie中获取session_id
	sessionID, err := c.Cookie("session_id")
	if err != nil {
		// 即使没有session_id，也返回成功（幂等性）
		RespondSuccess(c, nil, "登出成功")
		return
	}

	// 删除会话
	if err := h.authService.Logout(c.Request.Context(), sessionID); err != nil {
		h.logger.Error("logout failed", zap.Error(err))
		// 即使删除失败，也清除Cookie
	}

	// 清除Cookie
	c.SetCookie("session_id", "", -1, "/", "", false, true)

	// 返回成功响应
	RespondSuccess(c, nil, "登出成功")
}

