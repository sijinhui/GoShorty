package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"GoShorty/internal/config"
	"GoShorty/internal/database"
	"GoShorty/internal/repository"

	"go.uber.org/zap"
)

func main() {
	dryRun := flag.Bool("dry-run", false, "只显示将要删除的会话数量，不实际删除")
	flag.Parse()

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load config", zap.Error(err))
	}

	// 连接数据库
	db, err := database.NewPostgresDB(&cfg.Database, logger)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// 初始化Repository
	sessionRepo := repository.NewPostgresSessionRepository(db.Pool)

	ctx := context.Background()

	if *dryRun {
		logger.Info("Running in dry-run mode")
		fmt.Println("Dry-run mode: would delete expired sessions")
	} else {
		// 删除过期会话
		if err := sessionRepo.DeleteExpired(ctx); err != nil {
			logger.Fatal("Failed to delete expired sessions", zap.Error(err))
		}
		logger.Info("Successfully deleted expired sessions")
		fmt.Println("✅ Expired sessions cleaned up successfully")
	}
}
