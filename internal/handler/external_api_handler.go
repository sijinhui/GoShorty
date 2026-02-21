package handler

import (
	"strconv"
	"strings"

	"GoShorty/internal/domain"
	"GoShorty/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// ExternalAPIHandler 外部API处理器（/api/v1）
type ExternalAPIHandler struct {
	linkService   service.LinkService
	apiKeyService service.ApiKeyService
	logger        *zap.Logger
}

// NewExternalAPIHandler 创建一个新的ExternalAPIHandler
func NewExternalAPIHandler(
	linkService service.LinkService,
	apiKeyService service.ApiKeyService,
	logger *zap.Logger,
) *ExternalAPIHandler {
	return &ExternalAPIHandler{
		linkService:   linkService,
		apiKeyService: apiKeyService,
		logger:        logger,
	}
}

// Shorten 创建短链接（支持访客模式和管理员模式）
func (h *ExternalAPIHandler) Shorten(c *gin.Context) {
	var req struct {
		URL       string `json:"url" binding:"required"`
		CustomCode string `json:"custom_code,omitempty"`
		Title     string `json:"title,omitempty"`
		ExpiryDays int   `json:"expiry_days,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondBadRequest(c, "url is required")
		return
	}

	// 判断是否携带API Key（管理员模式）
	apiKey, isAdmin := h.extractApiKey(c)

	createReq := &service.CreateLinkRequest{
		URL:        req.URL,
		CustomCode: req.CustomCode,
		Title:      req.Title,
		CreatedIP:  getClientIP(c),
		ExpiryDays: req.ExpiryDays,
	}

	if isAdmin {
		// 管理员模式：使用API Key对应的用户ID，允许自定义短码和绕过最小长度
		createReq.UserID = apiKey.UserID
		createReq.BypassMinLength = true
	} else {
		// 访客模式：使用系统用户，不允许自定义短码
		createReq.UserID = 1
		createReq.CustomCode = "" // 访客不允许自定义短码
		createReq.ExpiryDays = 0  // 访客使用默认过期策略
	}

	link, err := h.linkService.CreateLink(c.Request.Context(), createReq)
	if err != nil {
		h.logger.Error("failed to create link via external api", zap.Error(err))
		RespondError(c, err)
		return
	}

	data := gin.H{
		"short_code":   link.Link.ShortCode,
		"short_url":    buildShortURL(c, link.Link.ShortCode),
		"original_url": link.Link.OriginalURL,
		"created_at":   link.Link.CreatedAt,
	}
	if link.ExpiresAt != nil {
		data["expires_at"] = link.ExpiresAt
		data["expiry_days"] = link.ExpiryDays
	}
	if isAdmin {
		data["title"] = link.Link.Title
		data["id"] = link.Link.ID
		data["mode"] = "admin"
	} else {
		data["mode"] = "guest"
	}

	RespondSuccess(c, data, "")
}

// extractApiKey 从Authorization头提取并验证API Key
func (h *ExternalAPIHandler) extractApiKey(c *gin.Context) (*domain.ApiKey, bool) {
	auth := c.GetHeader("Authorization")
	if auth == "" {
		return nil, false
	}

	// 支持 "Bearer gs-xxx" 格式
	token := strings.TrimPrefix(auth, "Bearer ")
	if token == auth {
		return nil, false
	}
	token = strings.TrimSpace(token)

	if !strings.HasPrefix(token, "gs-") {
		return nil, false
	}

	apiKey, err := h.apiKeyService.ValidateKey(c.Request.Context(), token)
	if err != nil {
		h.logger.Warn("invalid api key attempt", zap.Error(err))
		return nil, false
	}

	return apiKey, true
}

// ApiKeyAuthRequired API Key认证中间件（严格模式，无Key则拒绝）
func (h *ExternalAPIHandler) ApiKeyAuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" {
			RespondError(c, domain.ErrInvalidApiKey)
			c.Abort()
			return
		}

		token := strings.TrimPrefix(auth, "Bearer ")
		if token == auth || !strings.HasPrefix(strings.TrimSpace(token), "gs-") {
			RespondError(c, domain.ErrInvalidApiKey)
			c.Abort()
			return
		}

		apiKey, err := h.apiKeyService.ValidateKey(c.Request.Context(), strings.TrimSpace(token))
		if err != nil {
			RespondError(c, err)
			c.Abort()
			return
		}

		c.Set("api_key_user_id", apiKey.UserID)
		c.Set("api_key_id", apiKey.ID)
		c.Next()
	}
}

// GenerateApiKey 生成新的API密钥（管理后台调用）
func (h *ExternalAPIHandler) GenerateApiKey(c *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondBadRequest(c, "name is required")
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		RespondError(c, domain.ErrUnauthorized)
		return
	}

	rawKey, apiKey, err := h.apiKeyService.GenerateKey(c.Request.Context(), req.Name, userID.(int))
	if err != nil {
		h.logger.Error("failed to generate api key", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, gin.H{
		"key":        rawKey,
		"id":         apiKey.ID,
		"name":       apiKey.Name,
		"key_prefix": apiKey.KeyPrefix,
		"created_at": apiKey.CreatedAt,
		"message":    "请妥善保存此密钥，它不会再次显示",
	}, "API密钥创建成功")
}

// ListApiKeys 列出当前用户的所有API密钥
func (h *ExternalAPIHandler) ListApiKeys(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		RespondError(c, domain.ErrUnauthorized)
		return
	}

	keys, err := h.apiKeyService.ListKeys(c.Request.Context(), userID.(int))
	if err != nil {
		h.logger.Error("failed to list api keys", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, keys, "")
}

// RevokeApiKey 吊销API密钥
func (h *ExternalAPIHandler) RevokeApiKey(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondBadRequest(c, "invalid key id")
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		RespondError(c, domain.ErrUnauthorized)
		return
	}

	if err := h.apiKeyService.RevokeKey(c.Request.Context(), id, userID.(int)); err != nil {
		h.logger.Error("failed to revoke api key", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, nil, "API密钥已吊销")
}

// DeleteApiKey 删除API密钥
func (h *ExternalAPIHandler) DeleteApiKey(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondBadRequest(c, "invalid key id")
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		RespondError(c, domain.ErrUnauthorized)
		return
	}

	if err := h.apiKeyService.DeleteKey(c.Request.Context(), id, userID.(int)); err != nil {
		h.logger.Error("failed to delete api key", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, nil, "API密钥已删除")
}