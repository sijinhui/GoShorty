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

	// 读取并执行所有迁移文件
	migrationFiles := []string{
		"internal/database/migrations/001_initial_schema.sql",
		"internal/database/migrations/002_add_settings_table.sql",
		"internal/database/migrations/003_add_plugin_settings.sql",
		"internal/database/migrations/004_create_link_expiry_table.sql",
		"internal/database/migrations/005_alter_links_table.sql",
	}

	ctx := context.Background()
	for _, migrationFile := range migrationFiles {
		content, err := os.ReadFile(migrationFile)
		if err != nil {
			logger.Warn("Failed to read migration file", zap.String("file", migrationFile), zap.Error(err))
			continue
		}

		// 执行迁移
		_, err = db.Pool.Exec(ctx, string(content))
		if err != nil {
			logger.Warn("Failed to execute migration", zap.String("file", migrationFile), zap.Error(err))
			continue
		}

		logger.Info("Migration completed successfully",
			zap.String("file", filepath.Base(migrationFile)),
		)
	}

	fmt.Println("✅ Database migrations completed successfully!")
}
