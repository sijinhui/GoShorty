package handler

import (
	"net/http"
	"strconv"

	"GoShorty/internal/domain"
	"GoShorty/internal/plugin"
	"GoShorty/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// PluginHandler 插件管理处理器
type PluginHandler struct {
	pluginManager   *plugin.Manager
	settingsService service.SettingsService
	logger          *zap.Logger
}

// NewPluginHandler 创建一个新的PluginHandler
func NewPluginHandler(
	pluginManager *plugin.Manager,
	settingsService service.SettingsService,
	logger *zap.Logger,
) *PluginHandler {
	return &PluginHandler{
		pluginManager:   pluginManager,
		settingsService: settingsService,
		logger:          logger,
	}
}

// GetPlugins 获取所有插件列表
func (h *PluginHandler) GetPlugins(c *gin.Context) {
	plugins := make([]gin.H, 0)

	if expiryPlugin := h.pluginManager.GetExpiryPlugin(); expiryPlugin != nil {
		pluginInfo := gin.H{
			"name":    expiryPlugin.Name(),
			"version": expiryPlugin.Version(),
			"enabled": expiryPlugin.Enabled(),
			"type":    "expiry",
		}

		if expiryPlugin.Name() == "seven_day_expiry" {
			if days, err := h.settingsService.GetPluginConfig(c.Request.Context(), "seven_day_expiry", "days"); err == nil {
				pluginInfo["days"] = days
			}
		}

		plugins = append(plugins, pluginInfo)
	}

	for _, linkPlugin := range h.pluginManager.GetLinkPlugins() {
		plugins = append(plugins, gin.H{
			"name":    linkPlugin.Name(),
			"version": linkPlugin.Version(),
			"enabled": linkPlugin.Enabled(),
			"type":    "link",
		})
	}

	RespondSuccess(c, gin.H{"plugins": plugins}, "")
}

// respondPluginNotFound 返回插件不存在的错误响应
func respondPluginNotFound(c *gin.Context) {
	c.JSON(http.StatusNotFound, APIError{
		Success: false,
		Error:   "插件不存在",
		Code:    "PLUGIN_NOT_FOUND",
	})
}

// GetPluginConfig 获取插件配置
func (h *PluginHandler) GetPluginConfig(c *gin.Context) {
	pluginName := c.Param("name")
	if pluginName == "" {
		RespondBadRequest(c, "插件名称不能为空")
		return
	}

	p, exists := h.pluginManager.GetPlugin(pluginName)
	if !exists {
		respondPluginNotFound(c)
		return
	}

	config := gin.H{
		"name":    p.Name(),
		"version": p.Version(),
		"enabled": p.Enabled(),
	}

	if pluginName == "seven_day_expiry" {
		if days, err := h.settingsService.GetPluginConfig(c.Request.Context(), pluginName, "days"); err == nil {
			config["days"] = days
		}
	}

	RespondSuccess(c, config, "")
}

// UpdatePluginConfig 更新插件配置
func (h *PluginHandler) UpdatePluginConfig(c *gin.Context) {
	pluginName := c.Param("name")
	if pluginName == "" {
		RespondBadRequest(c, "插件名称不能为空")
		return
	}

	var req struct {
		Enabled *bool `json:"enabled"`
		Days    *int  `json:"days"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondBadRequest(c, "请求参数错误")
		return
	}

	if _, exists := h.pluginManager.GetPlugin(pluginName); !exists {
		respondPluginNotFound(c)
		return
	}

	ctx := c.Request.Context()

	if req.Enabled != nil {
		if err := h.settingsService.SetPluginEnabled(ctx, pluginName, *req.Enabled); err != nil {
			h.logger.Error("Failed to update plugin enabled status",
				zap.String("plugin", pluginName),
				zap.Bool("enabled", *req.Enabled),
				zap.Error(err))
			RespondError(c, domain.ErrInternalServer)
			return
		}
		h.logger.Info("Plugin enabled status updated",
			zap.String("plugin", pluginName),
			zap.Bool("enabled", *req.Enabled))
	}

	if pluginName == "seven_day_expiry" && req.Days != nil {
		if *req.Days < 1 || *req.Days > 365 {
			RespondBadRequest(c, "过期天数必须在1-365之间")
			return
		}

		if err := h.settingsService.SetPluginConfig(ctx, pluginName, "days", strconv.Itoa(*req.Days)); err != nil {
			h.logger.Error("Failed to update plugin days",
				zap.String("plugin", pluginName),
				zap.Int("days", *req.Days),
				zap.Error(err))
			RespondError(c, domain.ErrInternalServer)
			return
		}
		h.logger.Info("Plugin days updated",
			zap.String("plugin", pluginName),
			zap.Int("days", *req.Days))
	}

	RespondSuccess(c, gin.H{
		"message": "插件配置已更新，重启服务器后生效",
	}, "配置已更新")
}
