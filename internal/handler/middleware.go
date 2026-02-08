package handler

import (
	"net/http"
	"strings"

	"GoShorty/internal/domain"
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
	if strings.HasPrefix(c.Request.URL.Path, "/admin/api/") {
		RespondError(c, domain.ErrUnauthorized)
	} else {
		c.Redirect(http.StatusFound, "/admin/login")
	}
	c.Abort()
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
		clientIP := getClientIP(c)

		allowed, err := m.rateLimitService.CheckRateLimit(c.Request.Context(), clientIP, endpoint)
		if err != nil {
			m.logger.Error("rate limit check failed", zap.Error(err))
			c.Next()
			return
		}

		if !allowed {
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
