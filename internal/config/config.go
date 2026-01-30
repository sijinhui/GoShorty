package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Session  SessionConfig
	Log      LogConfig
	GeoIP    GeoIPConfig
	Plugin   PluginConfig
	Frontend FrontendConfig
}

type ServerConfig struct {
	Host    string
	Port    int
	BaseURL string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
	MaxConns int
	MinConns int
}

type SessionConfig struct {
	Secret string
	MaxAge time.Duration
}

type LogConfig struct {
	Level  string
	Format string
}

type GeoIPConfig struct {
	DBPath string
}

type PluginConfig struct {
	DefaultExpiryDays int
}

type FrontendConfig struct {
	Enabled    bool
	StaticPath string
	SPAMode    bool
}

func Load() (*Config, error) {
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AutomaticEnv()

	// 设置默认值
	setDefaults()

	// 读取配置文件（可选）
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		// 配置文件不存在，使用环境变量和默认值
	}

	config := &Config{
		Server: ServerConfig{
			Host:    viper.GetString("SERVER_HOST"),
			Port:    viper.GetInt("SERVER_PORT"),
			BaseURL: viper.GetString("BASE_URL"),
		},
		Database: DatabaseConfig{
			Host:     viper.GetString("DB_HOST"),
			Port:     viper.GetInt("DB_PORT"),
			User:     viper.GetString("DB_USER"),
			Password: viper.GetString("DB_PASSWORD"),
			DBName:   viper.GetString("DB_NAME"),
			SSLMode:  viper.GetString("DB_SSLMODE"),
			MaxConns: viper.GetInt("DB_MAX_CONNS"),
			MinConns: viper.GetInt("DB_MIN_CONNS"),
		},
		Session: SessionConfig{
			Secret: viper.GetString("SESSION_SECRET"),
			MaxAge: viper.GetDuration("SESSION_MAX_AGE") * time.Second,
		},
		Log: LogConfig{
			Level:  viper.GetString("LOG_LEVEL"),
			Format: viper.GetString("LOG_FORMAT"),
		},
		GeoIP: GeoIPConfig{
			DBPath: viper.GetString("GEOIP_DB_PATH"),
		},
		Plugin: PluginConfig{
			DefaultExpiryDays: viper.GetInt("DEFAULT_EXPIRY_DAYS"),
		},
		Frontend: FrontendConfig{
			Enabled:    viper.GetBool("FRONTEND_ENABLED"),
			StaticPath: viper.GetString("FRONTEND_STATIC_PATH"),
			SPAMode:    viper.GetBool("FRONTEND_SPA_MODE"),
		},
	}

	return config, nil
}

func setDefaults() {
	// 服务器默认值
	viper.SetDefault("SERVER_HOST", "0.0.0.0")
	viper.SetDefault("SERVER_PORT", 8080)
	viper.SetDefault("BASE_URL", "http://localhost:8080")

	// 数据库默认值
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", 5432)
	viper.SetDefault("DB_USER", "goshorty")
	viper.SetDefault("DB_PASSWORD", "")
	viper.SetDefault("DB_NAME", "goshorty")
	viper.SetDefault("DB_SSLMODE", "disable")
	viper.SetDefault("DB_MAX_CONNS", 25)
	viper.SetDefault("DB_MIN_CONNS", 5)

	// 会话默认值
	viper.SetDefault("SESSION_SECRET", "change-me-in-production")
	viper.SetDefault("SESSION_MAX_AGE", 86400) // 24小时

	// 日志默认值
	viper.SetDefault("LOG_LEVEL", "info")
	viper.SetDefault("LOG_FORMAT", "json")

	// GeoIP默认值
	viper.SetDefault("GEOIP_DB_PATH", "./data/GeoLite2-City.mmdb")

	// 插件默认值
	viper.SetDefault("DEFAULT_EXPIRY_DAYS", 7)

	// 前端默认值
	viper.SetDefault("FRONTEND_ENABLED", true)
	viper.SetDefault("FRONTEND_STATIC_PATH", "./frontend/dist")
	viper.SetDefault("FRONTEND_SPA_MODE", true)
}
