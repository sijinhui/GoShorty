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

// ShowLoginPage 显示登录页面
func (h *AdminHandler) ShowLoginPage(c *gin.Context) {
	c.HTML(http.StatusOK, "login.html", gin.H{
		"title": "登录 - GoShorty",
	})
}

// HandleLogin 处理登录请求
func (h *AdminHandler) HandleLogin(c *gin.Context) {
	var req struct {
		Username string `form:"username" binding:"required"`
		Password string `form:"password" binding:"required"`
	}

	if err := c.ShouldBind(&req); err != nil {
		c.HTML(http.StatusBadRequest, "admin/login.html", gin.H{
			"error": "请填写用户名和密码",
		})
		return
	}

	// 验证登录
	sessionID, err := h.authService.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		c.HTML(http.StatusUnauthorized, "admin/login.html", gin.H{
			"error": "用户名或密码错误",
		})
		return
	}

	// 设置Cookie
	c.SetCookie("session_id", sessionID, 86400, "/", "", false, true)

	// 重定向到仪表盘
	c.Redirect(http.StatusFound, "/admin/dashboard")
}

// HandleLogout 处理登出请求
func (h *AdminHandler) HandleLogout(c *gin.Context) {
	sessionID, _ := c.Cookie("session_id")
	if sessionID != "" {
		_ = h.authService.Logout(c.Request.Context(), sessionID)
	}

	// 清除Cookie
	c.SetCookie("session_id", "", -1, "/", "", false, true)

	// 重定向到登录页面
	c.Redirect(http.StatusFound, "/admin/login")
}

// ShowDashboard 显示仪表盘页面
func (h *AdminHandler) ShowDashboard(c *gin.Context) {
	username := c.GetString("username")

	// 获取统计数据
	stats, err := h.linkService.GetDashboardStats(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get dashboard stats", zap.Error(err))
		stats = map[string]interface{}{
			"total_links":  0,
			"active_links": 0,
			"today_clicks": 0,
			"total_clicks": 0,
		}
	}

	c.HTML(http.StatusOK, "dashboard.html", gin.H{
		"username": username,
		"active":   "dashboard",
		"stats":    stats,
	})
}

// ShowLinks 显示链接管理页面
func (h *AdminHandler) ShowLinks(c *gin.Context) {
	username := c.GetString("username")

	c.HTML(http.StatusOK, "links.html", gin.H{
		"username": username,
		"active":   "links",
	})
}

// ShowAnalytics 显示统计分析页面
func (h *AdminHandler) ShowAnalytics(c *gin.Context) {
	username := c.GetString("username")

	c.HTML(http.StatusOK, "analytics.html", gin.H{
		"username": username,
		"active":   "analytics",
	})
}
