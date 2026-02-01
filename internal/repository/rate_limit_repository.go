package repository

import (
	"context"
	"time"

	"GoShorty/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

// RateLimitRepository 定义速率限制数据访问接口
type RateLimitRepository interface {
	GetByIPAndEndpoint(ctx context.Context, ip, endpoint string) (*domain.RateLimit, error)
	Create(ctx context.Context, rateLimit *domain.RateLimit) error
	Update(ctx context.Context, rateLimit *domain.RateLimit) error
	DeleteExpired(ctx context.Context) error
}

// PostgresRateLimitRepository 是RateLimitRepository的PostgreSQL实现
type PostgresRateLimitRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresRateLimitRepository 创建一个新的PostgresRateLimitRepository
func NewPostgresRateLimitRepository(pool *pgxpool.Pool) *PostgresRateLimitRepository {
	return &PostgresRateLimitRepository{pool: pool}
}

// GetByIPAndEndpoint 根据IP和端点获取速率限制记录
func (r *PostgresRateLimitRepository) GetByIPAndEndpoint(ctx context.Context, ip, endpoint string) (*domain.RateLimit, error) {
	query := `
		SELECT id, ip, endpoint, count, window_end, created_at, updated_at
		FROM rate_limits
		WHERE ip = $1 AND endpoint = $2 AND window_end > NOW()
		ORDER BY created_at DESC
		LIMIT 1
	`

	rateLimit := &domain.RateLimit{}
	err := r.pool.QueryRow(ctx, query, ip, endpoint).Scan(
		&rateLimit.ID,
		&rateLimit.IP,
		&rateLimit.Endpoint,
		&rateLimit.Count,
		&rateLimit.WindowEnd,
		&rateLimit.CreatedAt,
		&rateLimit.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return rateLimit, nil
}

// Create 创建新的速率限制记录
func (r *PostgresRateLimitRepository) Create(ctx context.Context, rateLimit *domain.RateLimit) error {
	query := `
		INSERT INTO rate_limits (ip, endpoint, count, window_end, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`

	now := time.Now()
	err := r.pool.QueryRow(
		ctx,
		query,
		rateLimit.IP,
		rateLimit.Endpoint,
		rateLimit.Count,
		rateLimit.WindowEnd,
		now,
		now,
	).Scan(&rateLimit.ID)

	return err
}

// Update 更新速率限制记录
func (r *PostgresRateLimitRepository) Update(ctx context.Context, rateLimit *domain.RateLimit) error {
	query := `
		UPDATE rate_limits
		SET count = $1, window_end = $2, updated_at = $3
		WHERE id = $4
	`

	_, err := r.pool.Exec(
		ctx,
		query,
		rateLimit.Count,
		rateLimit.WindowEnd,
		time.Now(),
		rateLimit.ID,
	)

	return err
}

// DeleteExpired 删除过期的速率限制记录
func (r *PostgresRateLimitRepository) DeleteExpired(ctx context.Context) error {
	query := `
		DELETE FROM rate_limits
		WHERE window_end < NOW()
	`

	_, err := r.pool.Exec(ctx, query)
	return err
}
