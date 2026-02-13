package repository

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"GoShorty/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// LinkRepository 定义链接数据访问接口
type LinkRepository interface {
	Create(ctx context.Context, link *domain.Link) error
	GetByID(ctx context.Context, id int64) (*domain.Link, error)
	GetByShortCode(ctx context.Context, shortCode string) (*domain.Link, error)
	Update(ctx context.Context, link *domain.Link) error
	Delete(ctx context.Context, id int64) error
	DeleteByShortCodes(ctx context.Context, shortCodes []string) (int64, error)
	List(ctx context.Context, limit, offset int) ([]*domain.Link, error)
	ListAll(ctx context.Context) ([]*domain.Link, error)
	Search(ctx context.Context, keyword string, limit, offset int) ([]*domain.Link, error)
	Count(ctx context.Context) (int64, error)
	CountSearch(ctx context.Context, keyword string) (int64, error)
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

// linkColumns is the standard column list for link queries.
const linkColumns = `id, short_code, original_url, title, user_id, created_at, created_ip,
		       is_active, click_count, last_clicked_at, custom_code, metadata`

// scanLink scans a single link row into a domain.Link, handling JSON metadata deserialization.
func scanLink(scanner interface{ Scan(dest ...any) error }) (*domain.Link, error) {
	link := &domain.Link{}
	var metadataJSON []byte

	err := scanner.Scan(
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

	return link, nil
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

	return err
}

// GetByID 根据ID获取链接
func (r *PostgresLinkRepository) GetByID(ctx context.Context, id int64) (*domain.Link, error) {
	query := `
		SELECT ` + linkColumns + `
		FROM links
		WHERE id = $1
	`

	link, err := scanLink(r.pool.QueryRow(ctx, query, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrLinkNotFound
		}
		return nil, err
	}

	return link, nil
}

// GetByShortCode 根据短码获取链接
func (r *PostgresLinkRepository) GetByShortCode(ctx context.Context, shortCode string) (*domain.Link, error) {
	query := `
		SELECT ` + linkColumns + `
		FROM links
		WHERE short_code = $1
	`

	link, err := scanLink(r.pool.QueryRow(ctx, query, shortCode))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrLinkNotFound
		}
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
		SELECT ` + linkColumns + `
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
		link, err := scanLink(rows)
		if err != nil {
			return nil, err
		}
		links = append(links, link)
	}

	return links, rows.Err()
}

// ListAll 获取所有链接（用于导出）
func (r *PostgresLinkRepository) ListAll(ctx context.Context) ([]*domain.Link, error) {
	query := `
		SELECT ` + linkColumns + `
		FROM links
		ORDER BY created_at DESC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []*domain.Link
	for rows.Next() {
		link, err := scanLink(rows)
		if err != nil {
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

// DeleteByShortCodes 根据短码列表批量删除链接
func (r *PostgresLinkRepository) DeleteByShortCodes(ctx context.Context, shortCodes []string) (int64, error) {
	if len(shortCodes) == 0 {
		return 0, nil
	}
	query := `DELETE FROM links WHERE short_code = ANY($1)`
	result, err := r.pool.Exec(ctx, query, shortCodes)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}
func (r *PostgresLinkRepository) ExistsShortCode(ctx context.Context, shortCode string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM links WHERE short_code = $1)`

	var exists bool
	err := r.pool.QueryRow(ctx, query, shortCode).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}

// Count 获取链接总数
func (r *PostgresLinkRepository) Count(ctx context.Context) (int64, error) {
	query := `SELECT COUNT(*) FROM links`

	var count int64
	err := r.pool.QueryRow(ctx, query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// Search 搜索链接
func (r *PostgresLinkRepository) Search(ctx context.Context, keyword string, limit, offset int) ([]*domain.Link, error) {
	query := `SELECT ` + linkColumns + ` FROM links
		WHERE short_code ILIKE $1 OR original_url ILIKE $1 OR title ILIKE $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.pool.Query(ctx, query, "%"+keyword+"%", limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var links []*domain.Link
	for rows.Next() {
		link, err := scanLink(rows)
		if err != nil {
			return nil, err
		}
		links = append(links, link)
	}

	return links, rows.Err()
}

// CountSearch 获取搜索结果总数
func (r *PostgresLinkRepository) CountSearch(ctx context.Context, keyword string) (int64, error) {
	query := `SELECT COUNT(*) FROM links
		WHERE short_code ILIKE $1 OR original_url ILIKE $1 OR title ILIKE $1`

	var count int64
	err := r.pool.QueryRow(ctx, query, "%"+keyword+"%").Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}
