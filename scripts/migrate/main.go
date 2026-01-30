package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"GoShorty/internal/config"
	"GoShorty/internal/database"

	"go.uber.org/zap"
)

func main() {
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

	// 读取迁移文件
	migrationFile := "internal/database/migrations/001_initial_schema.sql"
	content, err := os.ReadFile(migrationFile)
	if err != nil {
		logger.Fatal("Failed to read migration file", zap.Error(err))
	}

	// 执行迁移
	ctx := context.Background()
	_, err = db.Pool.Exec(ctx, string(content))
	if err != nil {
		logger.Fatal("Failed to execute migration", zap.Error(err))
	}

	logger.Info("Migration completed successfully",
		zap.String("file", filepath.Base(migrationFile)),
	)

	fmt.Println("✅ Database migration completed successfully!")
}
