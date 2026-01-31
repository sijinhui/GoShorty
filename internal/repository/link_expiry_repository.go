package repository

import (
	"context"
	"errors"

	"GoShorty/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

// LinkExpiryRepository 定义链接过期数据访问接口
type LinkExpiryRepository interface {
	Create(ctx context.Context, expiry *domain.LinkExpiry) error
	GetByShortCode(ctx context.Context, shortCode string) (*domain.LinkExpiry, error)
	Update(ctx context.Context, expiry *domain.LinkExpiry) error
	Delete(ctx context.Context, shortCode string) error
	DeleteExpired(ctx context.Context) (int64, error)
	ListExpiring(ctx context.Context, limit int) ([]*domain.LinkExpiry, error)
	ListExpired(ctx context.Context, limit, offset int) ([]*domain.LinkExpiry, error)
}

// PostgresLinkExpiryRepository 是 LinkExpiryRepository 的 PostgreSQL 实现
type PostgresLinkExpiryRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresLinkExpiryRepository 创建一个新的 PostgresLinkExpiryRepository
func NewPostgresLinkExpiryRepository(pool *pgxpool.Pool) *PostgresLinkExpiryRepository {
	return &PostgresLinkExpiryRepository{pool: pool}
}

// Create 创建链接过期记录
func (r *PostgresLinkExpiryRepository) Create(ctx context.Context, expiry *domain.LinkExpiry) error {
	query := `
		INSERT INTO link_expiry (short_code, lifecycle_days, expires_at)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`

	err := r.pool.QueryRow(ctx, query,
		expiry.ShortCode,
		expiry.LifecycleDays,
		expiry.ExpiresAt,
	).Scan(&expiry.ID, &expiry.CreatedAt)

	return err
}

// GetByShortCode 根据短码获取过期信息
func (r *PostgresLinkExpiryRepository) GetByShortCode(ctx context.Context, shortCode string) (*domain.LinkExpiry, error) {
	query := `
		SELECT id, short_code, lifecycle_days, created_at, expires_at
		FROM link_expiry
		WHERE short_code = $1
	`

	expiry := &domain.LinkExpiry{}
	err := r.pool.QueryRow(ctx, query, shortCode).Scan(
		&expiry.ID,
		&expiry.ShortCode,
		&expiry.LifecycleDays,
		&expiry.CreatedAt,
		&expiry.ExpiresAt,
	)

	if err != nil {
		return nil, err
	}

	return expiry, nil
}

// Update 更新过期信息
func (r *PostgresLinkExpiryRepository) Update(ctx context.Context, expiry *domain.LinkExpiry) error {
	query := `
		UPDATE link_expiry
		SET lifecycle_days = $1, expires_at = $2
		WHERE short_code = $3
	`

	result, err := r.pool.Exec(ctx, query,
		expiry.LifecycleDays,
		expiry.ExpiresAt,
		expiry.ShortCode,
	)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return errors.New("link expiry not found")
	}

	return nil
}

// Delete 删除过期记录
func (r *PostgresLinkExpiryRepository) Delete(ctx context.Context, shortCode string) error {
	query := `DELETE FROM link_expiry WHERE short_code = $1`
	_, err := r.pool.Exec(ctx, query, shortCode)
	return err
}

// DeleteExpired 删除所有已过期的记录
func (r *PostgresLinkExpiryRepository) DeleteExpired(ctx context.Context) (int64, error) {
	query := `DELETE FROM link_expiry WHERE expires_at < NOW()`
	result, err := r.pool.Exec(ctx, query)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}

// ListExpiring 列出即将过期的链接
func (r *PostgresLinkExpiryRepository) ListExpiring(ctx context.Context, limit int) ([]*domain.LinkExpiry, error) {
	query := `
		SELECT id, short_code, lifecycle_days, created_at, expires_at
		FROM link_expiry
		WHERE expires_at > NOW()
		ORDER BY expires_at ASC
		LIMIT $1
	`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var expiries []*domain.LinkExpiry
	for rows.Next() {
		expiry := &domain.LinkExpiry{}
		err := rows.Scan(
			&expiry.ID,
			&expiry.ShortCode,
			&expiry.LifecycleDays,
			&expiry.CreatedAt,
			&expiry.ExpiresAt,
		)
		if err != nil {
			return nil, err
		}
		expiries = append(expiries, expiry)
	}

	return expiries, rows.Err()
}

// ListExpired 列出已过期的链接
func (r *PostgresLinkExpiryRepository) ListExpired(ctx context.Context, limit, offset int) ([]*domain.LinkExpiry, error) {
	query := `
		SELECT id, short_code, lifecycle_days, created_at, expires_at
		FROM link_expiry
		ORDER BY expires_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var expiries []*domain.LinkExpiry
	for rows.Next() {
		expiry := &domain.LinkExpiry{}
		err := rows.Scan(
			&expiry.ID,
			&expiry.ShortCode,
			&expiry.LifecycleDays,
			&expiry.CreatedAt,
			&expiry.ExpiresAt,
		)
		if err != nil {
			return nil, err
		}
		expiries = append(expiries, expiry)
	}

	return expiries, rows.Err()
}
