package main

import (
	"context"
	"flag"
	"fmt"

	"GoShorty/internal/config"
	"GoShorty/internal/database"
	"GoShorty/internal/repository"
	"GoShorty/internal/service"

	"go.uber.org/zap"
)

func main() {
	// 定义命令行参数
	username := flag.String("username", "", "管理员用户名")
	password := flag.String("password", "", "管理员密码")
	email := flag.String("email", "", "管理员邮箱（可选）")
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

	// 初始化Repository和Service
	userRepo := repository.NewPostgresUserRepository(db.Pool)
	sessionRepo := repository.NewPostgresSessionRepository(db.Pool)
	authService := service.NewAuthService(userRepo, sessionRepo, cfg.Session.MaxAge, logger)

	// 如果没有提供命令行参数，则使用交互式输入
	var finalUsername, finalPassword, finalEmail string

	if *username == "" {
		fmt.Print("请输入管理员用户名 (默认: admin): ")
		fmt.Scanln(&finalUsername)
		if finalUsername == "" {
			finalUsername = "admin"
		}
	} else {
		finalUsername = *username
	}

	if *password == "" {
		fmt.Print("请输入管理员密码: ")
		fmt.Scanln(&finalPassword)
		if finalPassword == "" {
			logger.Fatal("密码不能为空")
		}
	} else {
		finalPassword = *password
	}

	if *email == "" {
		fmt.Print("请输入管理员邮箱 (可选): ")
		fmt.Scanln(&finalEmail)
	} else {
		finalEmail = *email
	}

	// 创建管理员用户
	ctx := context.Background()
	if err := authService.CreateUser(ctx, finalUsername, finalPassword, finalEmail); err != nil {
		logger.Fatal("Failed to create admin user", zap.Error(err))
	}

	fmt.Printf("✅ 管理员用户创建成功！\n")
	fmt.Printf("用户名: %s\n", finalUsername)
	fmt.Printf("请妥善保管您的密码\n")
}
