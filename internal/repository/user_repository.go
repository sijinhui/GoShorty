package repository

import (
	"context"
	"database/sql"
	"errors"

	"GoShorty/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository 定义用户数据访问接口
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByID(ctx context.Context, id int) (*domain.User, error)
	GetByUsername(ctx context.Context, username string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	Delete(ctx context.Context, id int) error
}

// PostgresUserRepository 是UserRepository的PostgreSQL实现
type PostgresUserRepository struct {
	pool *pgxpool.Pool
}

// NewPostgresUserRepository 创建一个新的PostgresUserRepository
func NewPostgresUserRepository(pool *pgxpool.Pool) *PostgresUserRepository {
	return &PostgresUserRepository{pool: pool}
}

// Create 创建一个新用户
func (r *PostgresUserRepository) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (username, password_hash, email)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`

	err := r.pool.QueryRow(ctx, query,
		user.Username,
		user.PasswordHash,
		user.Email,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	return err
}

// GetByID 根据ID获取用户
func (r *PostgresUserRepository) GetByID(ctx context.Context, id int) (*domain.User, error) {
	query := `
		SELECT id, username, password_hash, email, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	user := &domain.User{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return user, nil
}

// GetByUsername 根据用户名获取用户
func (r *PostgresUserRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT id, username, password_hash, email, created_at, updated_at
		FROM users
		WHERE username = $1
	`

	user := &domain.User{}
	err := r.pool.QueryRow(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Email,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return user, nil
}

// Update 更新用户
func (r *PostgresUserRepository) Update(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users
		SET email = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`

	result, err := r.pool.Exec(ctx, query, user.Email, user.ID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return domain.ErrUserNotFound
	}

	return nil
}

// Delete 删除用户
func (r *PostgresUserRepository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM users WHERE id = $1`

	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return domain.ErrUserNotFound
	}

	return nil
}
