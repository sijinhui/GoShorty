package repository

import (
	"context"
	"errors"

	"GoShorty/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SettingsRepository 定义设置数据访问接口
type SettingsRepository interface {
	GetByKey(ctx context.Context, key string) (*domain.Settings, error)
	Update(ctx context.Context, key, value string) error
	GetAll(ctx context.Context) ([]*domain.Settings, error)
}

// PostgresSettingsRepository 是SettingsRepository的PostgreSQL实现
type PostgresSettingsRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresSettingsRepository 创建一个新的PostgresSettingsRepository
func NewPostgresSettingsRepository(pool *pgxpool.Pool) *PostgresSettingsRepository {
	return &PostgresSettingsRepository{pool: pool}
}

// GetByKey 根据key获取设置
func (r *PostgresSettingsRepository) GetByKey(ctx context.Context, key string) (*domain.Settings, error) {
	query := `
		SELECT id, key, value, description, created_at, updated_at
		FROM settings
		WHERE key = $1
	`

	settings := &domain.Settings{}
	err := r.pool.QueryRow(ctx, query, key).Scan(
		&settings.ID,
		&settings.Key,
		&settings.Value,
		&settings.Description,
		&settings.CreatedAt,
		&settings.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("setting not found")
		}
		return nil, err
	}

	return settings, nil
}

// Update 更新设置值
func (r *PostgresSettingsRepository) Update(ctx context.Context, key, value string) error {
	query := `
		UPDATE settings
		SET value = $1, updated_at = CURRENT_TIMESTAMP
		WHERE key = $2
	`

	result, err := r.pool.Exec(ctx, query, value, key)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return errors.New("setting not found")
	}

	return nil
}

// GetAll 获取所有设置
func (r *PostgresSettingsRepository) GetAll(ctx context.Context) ([]*domain.Settings, error) {
	query := `
		SELECT id, key, value, description, created_at, updated_at
		FROM settings
		ORDER BY key
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var settings []*domain.Settings
	for rows.Next() {
		setting := &domain.Settings{}
		err := rows.Scan(
			&setting.ID,
			&setting.Key,
			&setting.Value,
			&setting.Description,
			&setting.CreatedAt,
			&setting.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		settings = append(settings, setting)
	}

	return settings, rows.Err()
}
