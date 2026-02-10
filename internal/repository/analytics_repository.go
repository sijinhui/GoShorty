package repository

import (
	"context"

	"GoShorty/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// AnalyticsRepository 定义统计数据访问接口
type AnalyticsRepository interface {
	CreateAccessLog(ctx context.Context, log *domain.AccessLog) error
	BatchCreateAccessLogs(ctx context.Context, logs []*domain.AccessLog) error
	GetAccessLogsByLinkID(ctx context.Context, linkID int64, limit, offset int) ([]*domain.AccessLog, error)
	GetAccessLogCount(ctx context.Context, linkID int64) (int64, error)
	GetAccessLogsByCountry(ctx context.Context, linkID int64) (map[string]int64, error)
}

// PostgresAnalyticsRepository 是AnalyticsRepository的PostgreSQL实现
type PostgresAnalyticsRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresAnalyticsRepository 创建一个新的PostgresAnalyticsRepository
func NewPostgresAnalyticsRepository(pool *pgxpool.Pool) *PostgresAnalyticsRepository {
	return &PostgresAnalyticsRepository{pool: pool}
}

// CreateAccessLog 创建一条访问日志
func (r *PostgresAnalyticsRepository) CreateAccessLog(ctx context.Context, log *domain.AccessLog) error {
	query := `
		INSERT INTO access_logs (link_id, ip_address, user_agent, referer, country, city, latitude, longitude)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, accessed_at
	`

	err := r.pool.QueryRow(ctx, query,
		log.LinkID,
		log.IPAddress,
		log.UserAgent,
		log.Referer,
		log.Country,
		log.City,
		log.Latitude,
		log.Longitude,
	).Scan(&log.ID, &log.AccessedAt)

	return err
}

// BatchCreateAccessLogs 批量创建访问日志
func (r *PostgresAnalyticsRepository) BatchCreateAccessLogs(ctx context.Context, logs []*domain.AccessLog) error {
	if len(logs) == 0 {
		return nil
	}

	query := `
		INSERT INTO access_logs (link_id, ip_address, user_agent, referer, country, city, latitude, longitude, accessed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	batch := &pgx.Batch{}
	for _, log := range logs {
		batch.Queue(query,
			log.LinkID,
			log.IPAddress,
			log.UserAgent,
			log.Referer,
			log.Country,
			log.City,
			log.Latitude,
			log.Longitude,
			log.AccessedAt,
		)
	}

	br := r.pool.SendBatch(ctx, batch)
	defer br.Close()

	for range logs {
		if _, err := br.Exec(); err != nil {
			return err
		}
	}

	return nil
}

// GetAccessLogsByLinkID 根据链接ID获取访问日志
func (r *PostgresAnalyticsRepository) GetAccessLogsByLinkID(ctx context.Context, linkID int64, limit, offset int) ([]*domain.AccessLog, error) {
	query := `
		SELECT id, link_id, ip_address::text, user_agent, referer, country, city, latitude, longitude, accessed_at
		FROM access_logs
		WHERE link_id = $1
		ORDER BY accessed_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.pool.Query(ctx, query, linkID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*domain.AccessLog
	for rows.Next() {
		log := &domain.AccessLog{}
		err := rows.Scan(
			&log.ID,
			&log.LinkID,
			&log.IPAddress,
			&log.UserAgent,
			&log.Referer,
			&log.Country,
			&log.City,
			&log.Latitude,
			&log.Longitude,
			&log.AccessedAt,
		)
		if err != nil {
			return nil, err
		}
		logs = append(logs, log)
	}

	return logs, rows.Err()
}

// GetAccessLogCount 获取链接的访问日志总数
func (r *PostgresAnalyticsRepository) GetAccessLogCount(ctx context.Context, linkID int64) (int64, error) {
	query := `SELECT COUNT(*) FROM access_logs WHERE link_id = $1`

	var count int64
	err := r.pool.QueryRow(ctx, query, linkID).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetAccessLogsByCountry 按国家统计访问日志
func (r *PostgresAnalyticsRepository) GetAccessLogsByCountry(ctx context.Context, linkID int64) (map[string]int64, error) {
	query := `
		SELECT country, COUNT(*) as count
		FROM access_logs
		WHERE link_id = $1 AND country IS NOT NULL
		GROUP BY country
		ORDER BY count DESC
	`

	rows, err := r.pool.Query(ctx, query, linkID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int64)
	for rows.Next() {
		var country string
		var count int64
		if err := rows.Scan(&country, &count); err != nil {
			return nil, err
		}
		result[country] = count
	}

	return result, rows.Err()
}
