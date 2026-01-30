package validator

import "errors"

var (
	ErrEmptyURL      = errors.New("URL cannot be empty")
	ErrInvalidURL    = errors.New("invalid URL format")
	ErrInvalidScheme = errors.New("URL scheme must be http or https")
	ErrMissingHost   = errors.New("URL must have a host")
)
