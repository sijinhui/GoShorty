package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"GoShorty/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

// SessionRepository 定义会话数据访问接口
type SessionRepository interface {
	Create(ctx context.Context, session *domain.Session) error
	GetByID(ctx context.Context, id string) (*domain.Session, error)
	Delete(ctx context.Context, id string) error
	DeleteExpired(ctx context.Context) error
}

// PostgresSessionRepository 是SessionRepository的PostgreSQL实现
type PostgresSessionRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresSessionRepository 创建一个新的PostgresSessionRepository
func NewPostgresSessionRepository(pool *pgxpool.Pool) *PostgresSessionRepository {
	return &PostgresSessionRepository{pool: pool}
}

// Create 创建一个新会话
func (r *PostgresSessionRepository) Create(ctx context.Context, session *domain.Session) error {
	dataJSON, err := json.Marshal(session.Data)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO sessions (id, user_id, data, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING created_at
	`

	err = r.pool.QueryRow(ctx, query,
		session.ID,
		session.UserID,
		dataJSON,
		session.ExpiresAt,
	).Scan(&session.CreatedAt)

	return err
}

// GetByID 根据ID获取会话
func (r *PostgresSessionRepository) GetByID(ctx context.Context, id string) (*domain.Session, error) {
	query := `
		SELECT id, user_id, data, expires_at, created_at
		FROM sessions
		WHERE id = $1
	`

	session := &domain.Session{}
	var dataJSON []byte

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&session.ID,
		&session.UserID,
		&dataJSON,
		&session.ExpiresAt,
		&session.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrSessionNotFound
		}
		return nil, err
	}

	if err := json.Unmarshal(dataJSON, &session.Data); err != nil {
		return nil, err
	}

	return session, nil
}

// Delete 删除会话
func (r *PostgresSessionRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM sessions WHERE id = $1`

	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return domain.ErrSessionNotFound
	}

	return nil
}

// DeleteExpired 删除过期的会话
func (r *PostgresSessionRepository) DeleteExpired(ctx context.Context) error {
	query := `DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`

	_, err := r.pool.Exec(ctx, query)
	return err
}
