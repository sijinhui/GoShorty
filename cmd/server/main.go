package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"GoShorty/internal/config"
	"GoShorty/internal/database"
	"GoShorty/internal/handler"
	"GoShorty/internal/plugin"
	"GoShorty/internal/repository"
	"GoShorty/internal/service"
	"GoShorty/pkg/geolocation"
	"GoShorty/plugins/expiration"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// 初始化日志
	logger, err := initLogger()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Info("Starting GoShorty...")

	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load config", zap.Error(err))
	}

	logger.Info("Configuration loaded",
		zap.String("host", cfg.Server.Host),
		zap.Int("port", cfg.Server.Port),
	)

	// 连接数据库
	db, err := database.NewPostgresDB(&cfg.Database, logger)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// 初始化Repository层
	linkRepo := repository.NewPostgresLinkRepository(db.Pool)
	linkExpiryRepo := repository.NewPostgresLinkExpiryRepository(db.Pool)
	userRepo := repository.NewPostgresUserRepository(db.Pool)
	sessionRepo := repository.NewPostgresSessionRepository(db.Pool)
	analyticsRepo := repository.NewPostgresAnalyticsRepository(db.Pool)
	settingsRepo := repository.NewPostgresSettingsRepository(db.Pool)

	// 初始化Service层（需要先创建settingsService以便加载插件配置）
	settingsService := service.NewSettingsService(settingsRepo, logger)

	// 初始化插件系统
	pluginManager := plugin.NewManager(logger)
	hooks := plugin.NewHooks(pluginManager, logger)

	// 注册7天过期插件
	expiryPlugin := expiration.NewSevenDayExpiryPlugin()

	// 从数据库加载插件配置
	ctx := context.Background()
	if enabled, err := settingsService.GetPluginEnabled(ctx, "seven_day_expiry"); err == nil {
		expiryPlugin.SetEnabled(enabled)
		logger.Info("Loaded plugin enabled status", zap.Bool("enabled", enabled))
	} else {
		logger.Warn("Failed to load plugin enabled status, using default", zap.Error(err))
	}

	if daysStr, err := settingsService.GetPluginConfig(ctx, "seven_day_expiry", "days"); err == nil {
		if days, err := strconv.Atoi(daysStr); err == nil && days > 0 {
			expiryPlugin.SetDays(days)
			logger.Info("Loaded plugin expiry days", zap.Int("days", days))
		}
	} else {
		logger.Warn("Failed to load plugin expiry days, using default", zap.Error(err))
	}

	if err := pluginManager.Register(expiryPlugin); err != nil {
		logger.Warn("Failed to register expiry plugin", zap.Error(err))
	}

	// 从数据库获取短链接长度配置
	shortCodeLength, err := settingsService.GetShortCodeLength(context.Background())
	if err != nil {
		logger.Warn("Failed to get short_code_length from database, using default 3", zap.Error(err))
		shortCodeLength = 3
	}
	logger.Info("Short code length configured", zap.Int("length", shortCodeLength))

	codeGenerator := service.NewBase62Generator(shortCodeLength)
	linkService := service.NewLinkService(linkRepo, linkExpiryRepo, codeGenerator, hooks, logger)
	linkExpiryService := service.NewLinkExpiryService(linkExpiryRepo, logger)
	authService := service.NewAuthService(userRepo, sessionRepo, cfg.Session.MaxAge, logger)
	geoResolver := geolocation.NewSimpleGeoIPResolver()
	analyticsService := service.NewAnalyticsService(analyticsRepo, geoResolver, logger)

	// 初始化Handler层
	redirectHandler := handler.NewRedirectHandler(linkService, analyticsService, logger)
	authMiddleware := handler.NewAuthMiddleware(authService, logger)
	adminHandler := handler.NewAdminHandler(authService, linkService, logger)
	apiHandler := handler.NewAPIHandler(linkService, analyticsService, logger)
	settingsHandler := handler.NewSettingsHandler(settingsService, logger)
	pluginHandler := handler.NewPluginHandler(pluginManager, settingsService, logger)
	linkExpiryHandler := handler.NewLinkExpiryHandler(linkExpiryService, logger)

	// 初始化Gin
	if cfg.Log.Level == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// 配置CORS（开发环境）
	if cfg.Log.Level != "production" {
		router.Use(cors.New(cors.Config{
			AllowOrigins:     []string{"http://localhost:5173"},
			AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
			AllowCredentials: true,
		}))
	}

	// 管理后台路由（不需要认证）
	router.POST("/admin/api/auth/login", adminHandler.HandleAPILogin)

	// 管理后台API路由（需要认证）
	admin := router.Group("/admin")
	admin.Use(authMiddleware.RequireAuth())
	{
		// API路由
		api := admin.Group("/api")
		{
			api.GET("/auth/check", adminHandler.HandleCheckAuth)
			api.POST("/auth/logout", adminHandler.HandleLogout)
			api.GET("/dashboard/stats", apiHandler.GetDashboardStats)
			api.POST("/links", apiHandler.CreateLink)
			api.GET("/links", apiHandler.GetLinks)
			api.DELETE("/links/:id", apiHandler.DeleteLink)
			api.GET("/analytics/link", apiHandler.GetLinkAnalytics)
			api.GET("/settings", settingsHandler.GetSettings)
			api.PUT("/settings", settingsHandler.UpdateSettings)
			api.GET("/plugins", pluginHandler.GetPlugins)
			api.GET("/plugins/:name/config", pluginHandler.GetPluginConfig)
			api.PUT("/plugins/:name/config", pluginHandler.UpdatePluginConfig)
			// 过期链接管理路由
			api.GET("/link-expiry", linkExpiryHandler.HandleListExpired)
			api.DELETE("/link-expiry/:shortCode", linkExpiryHandler.HandleDeleteExpired)
			api.DELETE("/link-expiry/batch/all", linkExpiryHandler.HandleDeleteAllExpired)
		}
	}

	// 健康检查端点
	router.GET("/health", func(c *gin.Context) {
		if err := db.Ping(c.Request.Context()); err != nil {
			c.JSON(500, gin.H{"status": "unhealthy", "error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// 公开API端点（不需要认证）
	publicAPI := router.Group("/api")
	{
		publicAPI.POST("/links", apiHandler.CreatePublicLink)
	}

	// 配置前端静态文件服务
	if cfg.Frontend.Enabled {
		// 静态资源（CSS, JS, images等）
		router.Static("/assets", filepath.Join(cfg.Frontend.StaticPath, "assets"))

		// 管理后台前端路由（返回index.html，让React处理路由）
		adminPages := []string{"/admin", "/admin/login", "/admin/dashboard", "/admin/links", "/admin/analytics", "/admin/settings", "/admin/link-expiry"}
		for _, path := range adminPages {
			router.GET(path, func(c *gin.Context) {
				c.File(filepath.Join(cfg.Frontend.StaticPath, "index.html"))
			})
		}

		// 根目录静态文件（vite.svg, react.svg等）
		staticFiles := []string{"vite.svg", "react.svg", "favicon.ico"}
		for _, file := range staticFiles {
			file := file // 创建局部变量副本，避免闭包问题
			filePath := filepath.Join(cfg.Frontend.StaticPath, file)
			router.GET("/"+file, func(c *gin.Context) {
				c.File(filePath)
			})
		}

		logger.Info("Frontend static files enabled",
			zap.String("path", cfg.Frontend.StaticPath),
			zap.Bool("spa_mode", cfg.Frontend.SPAMode),
		)
	}

	// 配置重定向路由（必须在其他路由之后，因为使用了通配符）
	router.GET("/:code", redirectHandler.HandleRedirect)

	// SPA fallback - 所有未匹配的路由返回index.html
	if cfg.Frontend.Enabled && cfg.Frontend.SPAMode {
		router.NoRoute(func(c *gin.Context) {
			// 如果是API请求，返回404
			if strings.HasPrefix(c.Request.URL.Path, "/api/") ||
			   strings.HasPrefix(c.Request.URL.Path, "/admin/api/") {
				c.JSON(404, gin.H{"error": "Not Found"})
				return
			}

			// 尝试查找静态文件
			filePath := filepath.Join(cfg.Frontend.StaticPath, c.Request.URL.Path)
			if _, err := os.Stat(filePath); err == nil {
				c.File(filePath)
				return
			}

			// 其他请求返回index.html（让前端路由处理）
			c.File(filepath.Join(cfg.Frontend.StaticPath, "index.html"))
		})
	}

	// 启动服务器
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	logger.Info("Server starting", zap.String("address", addr))

	// 优雅关闭
	srv := &gin.Engine{}
	*srv = *router

	go func() {
		if err := router.Run(addr); err != nil {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 这里可以添加清理逻辑
	_ = ctx

	logger.Info("Server stopped")
}

func initLogger() (*zap.Logger, error) {
	return zap.NewProduction()
}
