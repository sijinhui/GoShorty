package handler

import (
	"net/http"
	"strings"

	"GoShorty/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// AuthMiddleware 认证中间件
type AuthMiddleware struct {
	authService service.AuthService
	logger      *zap.Logger
}

// NewAuthMiddleware 创建一个新的认证中间件
func NewAuthMiddleware(authService service.AuthService, logger *zap.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
		logger:      logger,
	}
}

// RequireAuth 要求认证的中间件
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从Cookie中获取session_id
		sessionID, err := c.Cookie("session_id")
		if err != nil {
			m.handleAuthFailure(c)
			return
		}

		// 验证会话
		session, err := m.authService.ValidateSession(c.Request.Context(), sessionID)
		if err != nil {
			// 清除无效的Cookie
			c.SetCookie("session_id", "", -1, "/", "", false, true)
			m.handleAuthFailure(c)
			return
		}

		// 将用户ID存储到context中
		c.Set("user_id", session.UserID)
		c.Set("session_id", session.ID)

		c.Next()
	}
}

// handleAuthFailure 处理认证失败的情况
func (m *AuthMiddleware) handleAuthFailure(c *gin.Context) {
	// 判断是否为API请求
	if strings.HasPrefix(c.Request.URL.Path, "/admin/api/") {
		// API请求返回JSON
		c.JSON(http.StatusUnauthorized, APIError{
			Success: false,
			Error:   "未授权访问",
			Code:    "UNAUTHORIZED",
		})
		c.Abort()
	} else {
		// 页面请求重定向到登录页
		c.Redirect(http.StatusFound, "/admin/login")
		c.Abort()
	}
}

// RateLimitMiddleware 速率限制中间件
type RateLimitMiddleware struct {
	rateLimitService service.RateLimitService
	logger           *zap.Logger
}

// NewRateLimitMiddleware 创建一个新的速率限制中间件
func NewRateLimitMiddleware(rateLimitService service.RateLimitService, logger *zap.Logger) *RateLimitMiddleware {
	return &RateLimitMiddleware{
		rateLimitService: rateLimitService,
		logger:           logger,
	}
}

// RateLimit 速率限制中间件处理函数
func (m *RateLimitMiddleware) RateLimit(endpoint string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取客户端IP
		clientIP := getClientIP(c)

		// 检查速率限制
		allowed, err := m.rateLimitService.CheckRateLimit(c.Request.Context(), clientIP, endpoint)
		if err != nil {
			m.logger.Error("rate limit check failed", zap.Error(err))
			// 出错时允许请求继续
			c.Next()
			return
		}

		if !allowed {
			// 超过速率限制
			c.JSON(http.StatusTooManyRequests, APIError{
				Success: false,
				Error:   "请求过于频繁，请稍后再试",
				Code:    "RATE_LIMIT_EXCEEDED",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
