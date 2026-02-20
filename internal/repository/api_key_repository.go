package repository

import (
	"context"

	"GoShorty/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ApiKeyRepository 定义API密钥数据访问接口
type ApiKeyRepository interface {
	Create(ctx context.Context, key *domain.ApiKey) error
	GetByKeyHash(ctx context.Context, keyHash string) (*domain.ApiKey, error)
	List(ctx context.Context, userID int) ([]*domain.ApiKey, error)
	Delete(ctx context.Context, id int, userID int) error
	UpdateLastUsed(ctx context.Context, id int) error
	Revoke(ctx context.Context, id int, userID int) error
}

// PostgresApiKeyRepository 是ApiKeyRepository的PostgreSQL实现
type PostgresApiKeyRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresApiKeyRepository 创建一个新的PostgresApiKeyRepository
func NewPostgresApiKeyRepository(pool *pgxpool.Pool) *PostgresApiKeyRepository {
	return &PostgresApiKeyRepository{pool: pool}
}

// Create 创建一个新的API密钥记录
func (r *PostgresApiKeyRepository) Create(ctx context.Context, key *domain.ApiKey) error {
	query := `INSERT INTO api_keys (key_hash, key_prefix, name, user_id, is_active)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at`
	return r.pool.QueryRow(ctx, query,
		key.KeyHash, key.KeyPrefix, key.Name, key.UserID, true,
	).Scan(&key.ID, &key.CreatedAt)
}

// GetByKeyHash 通过密钥哈希查找API密钥
func (r *PostgresApiKeyRepository) GetByKeyHash(ctx context.Context, keyHash string) (*domain.ApiKey, error) {
	query := `SELECT id, key_hash, key_prefix, name, user_id, is_active, last_used_at, created_at
		FROM api_keys WHERE key_hash = $1`
	key := &domain.ApiKey{}
	err := r.pool.QueryRow(ctx, query, keyHash).Scan(
		&key.ID, &key.KeyHash, &key.KeyPrefix, &key.Name,
		&key.UserID, &key.IsActive, &key.LastUsedAt, &key.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrInvalidApiKey
		}
		return nil, err
	}
	return key, nil
}

// List 列出用户的所有API密钥
func (r *PostgresApiKeyRepository) List(ctx context.Context, userID int) ([]*domain.ApiKey, error) {
	query := `SELECT id, key_hash, key_prefix, name, user_id, is_active, last_used_at, created_at
		FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []*domain.ApiKey
	for rows.Next() {
		key := &domain.ApiKey{}
		if err := rows.Scan(
			&key.ID, &key.KeyHash, &key.KeyPrefix, &key.Name,
			&key.UserID, &key.IsActive, &key.LastUsedAt, &key.CreatedAt,
		); err != nil {
			return nil, err
		}
		keys = append(keys, key)
	}
	return keys, rows.Err()
}

// Delete 删除API密钥
func (r *PostgresApiKeyRepository) Delete(ctx context.Context, id int, userID int) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM api_keys WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

// UpdateLastUsed 更新最后使用时间
func (r *PostgresApiKeyRepository) UpdateLastUsed(ctx context.Context, id int) error {
	_, err := r.pool.Exec(ctx, `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, id)
	return err
}

// Revoke 吊销API密钥
func (r *PostgresApiKeyRepository) Revoke(ctx context.Context, id int, userID int) error {
	_, err := r.pool.Exec(ctx, `UPDATE api_keys SET is_active = FALSE WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}