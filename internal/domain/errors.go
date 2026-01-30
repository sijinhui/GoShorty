package domain

import "errors"

var (
	// Link errors
	ErrLinkNotFound      = errors.New("link not found")
	ErrLinkExpired       = errors.New("link expired")
	ErrLinkInactive      = errors.New("link inactive")
	ErrShortCodeExists   = errors.New("short code already exists")
	ErrInvalidShortCode  = errors.New("invalid short code format")
	ErrInvalidURL        = errors.New("invalid URL")

	// User errors
	ErrUserNotFound      = errors.New("user not found")
	ErrUserExists        = errors.New("user already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")

	// Session errors
	ErrSessionNotFound   = errors.New("session not found")
	ErrSessionExpired    = errors.New("session expired")

	// General errors
	ErrInternalServer    = errors.New("internal server error")
	ErrUnauthorized      = errors.New("unauthorized")
	ErrForbidden         = errors.New("forbidden")
)
