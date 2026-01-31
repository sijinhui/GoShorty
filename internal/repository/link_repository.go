package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"GoShorty/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

// LinkRepository 定义链接数据访问接口
type LinkRepository interface {
	Create(ctx context.Context, link *domain.Link) error
	GetByID(ctx context.Context, id int64) (*domain.Link, error)
	GetByShortCode(ctx context.Context, shortCode string) (*domain.Link, error)
	Update(ctx context.Context, link *domain.Link) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, limit, offset int) ([]*domain.Link, error)
	IncrementClickCount(ctx context.Context, id int64) error
	DeleteExpired(ctx context.Context, before time.Time) error
	ExistsShortCode(ctx context.Context, shortCode string) (bool, error)
}

// PostgresLinkRepository 是LinkRepository的PostgreSQL实现
type PostgresLinkRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresLinkRepository 创建一个新的PostgresLinkRepository
func NewPostgresLinkRepository(pool *pgxpool.Pool) *PostgresLinkRepository {
	return &PostgresLinkRepository{pool: pool}
}

// Create 创建一个新的链接
func (r *PostgresLinkRepository) Create(ctx context.Context, link *domain.Link) error {
	metadataJSON, err := json.Marshal(link.Metadata)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO links (short_code, original_url, title, user_id, created_ip, is_active, custom_code, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`

	err = r.pool.QueryRow(ctx, query,
		link.ShortCode,
		link.OriginalURL,
		link.Title,
		link.UserID,
		link.CreatedIP,
		link.IsActive,
		link.CustomCode,
		metadataJSON,
	).Scan(&link.ID, &link.CreatedAt)

	if err != nil {
		return err
	}

	return nil
}

// GetByID 根据ID获取链接
func (r *PostgresLinkRepository) GetByID(ctx context.Context, id int64) (*domain.Link, error) {
	query := `
		SELECT id, short_code, original_url, title, user_id, created_at, created_ip,
		       is_active, click_count, last_clicked_at, custom_code, metadata
		FROM links
		WHERE id = $1
	`

	link := &domain.Link{}
	var metadataJSON []byte

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&link.ID,
		&link.ShortCode,
		&link.OriginalURL,
		&link.Title,
		&link.UserID,
		&link.CreatedAt,
		&link.CreatedIP,
		&link.IsActive,
		&link.ClickCount,
		&link.LastClickedAt,
		&link.CustomCode,
		&metadataJSON,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrLinkNotFound
		}
		return nil, err
	}

	if err := json.Unmarshal(metadataJSON, &link.Metadata); err != nil {
		return nil, err
	}

	return link, nil
}

// GetByShortCode 根据短码获取链接
func (r *PostgresLinkRepository) GetByShortCode(ctx context.Context, shortCode string) (*domain.Link, error) {
	query := `
		SELECT id, short_code, original_url, title, user_id, created_at, created_ip,
		       is_active, click_count, last_clicked_at, custom_code, metadata
		FROM links
		WHERE short_code = $1
	`

	link := &domain.Link{}
	var metadataJSON []byte

	err := r.pool.QueryRow(ctx, query, shortCode).Scan(
		&link.ID,
		&link.ShortCode,
		&link.OriginalURL,
		&link.Title,
		&link.UserID,
		&link.CreatedAt,
		&link.CreatedIP,
		&link.IsActive,
		&link.ClickCount,
		&link.LastClickedAt,
		&link.CustomCode,
		&metadataJSON,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrLinkNotFound
		}
		return nil, err
	}

	if err := json.Unmarshal(metadataJSON, &link.Metadata); err != nil {
		return nil, err
	}

	return link, nil
}

// Update 更新链接
func (r *PostgresLinkRepository) Update(ctx context.Context, link *domain.Link) error {
	metadataJSON, err := json.Marshal(link.Metadata)
	if err != nil {
		return err
	}

	query := `
		UPDATE links
		SET original_url = $1, title = $2, is_active = $3, metadata = $4
		WHERE id = $5
	`

	result, err := r.pool.Exec(ctx, query,
		link.OriginalURL,
		link.Title,
		link.IsActive,
		metadataJSON,
		link.ID,
	)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return domain.ErrLinkNotFound
	}

	return nil
}

// Delete 删除链接
func (r *PostgresLinkRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM links WHERE id = $1`

	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return domain.ErrLinkNotFound
	}

	return nil
}

// List 获取链接列表
func (r *PostgresLinkRepository) List(ctx context.Context, limit, offset int) ([]*domain.Link, error) {
	query := `
		SELECT id, short_code, original_url, title, user_id, created_at, created_ip,
		       is_active, click_count, last_clicked_at, custom_code, metadata
		FROM links
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []*domain.Link
	for rows.Next() {
		link := &domain.Link{}
		var metadataJSON []byte

		err := rows.Scan(
			&link.ID,
			&link.ShortCode,
			&link.OriginalURL,
			&link.Title,
			&link.UserID,
			&link.CreatedAt,
			&link.CreatedIP,
			&link.IsActive,
			&link.ClickCount,
			&link.LastClickedAt,
			&link.CustomCode,
			&metadataJSON,
		)

		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(metadataJSON, &link.Metadata); err != nil {
			return nil, err
		}

		links = append(links, link)
	}

	return links, rows.Err()
}

// IncrementClickCount 增加点击计数
func (r *PostgresLinkRepository) IncrementClickCount(ctx context.Context, id int64) error {
	query := `
		UPDATE links
		SET click_count = click_count + 1, last_clicked_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	_, err := r.pool.Exec(ctx, query, id)
	return err
}

// DeleteExpired 删除过期的链接
func (r *PostgresLinkRepository) DeleteExpired(ctx context.Context, before time.Time) error {
	query := `DELETE FROM links WHERE expires_at IS NOT NULL AND expires_at < $1`

	_, err := r.pool.Exec(ctx, query, before)
	return err
}

// ExistsShortCode 检查短码是否已存在
func (r *PostgresLinkRepository) ExistsShortCode(ctx context.Context, shortCode string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM links WHERE short_code = $1)`

	var exists bool
	err := r.pool.QueryRow(ctx, query, shortCode).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}
