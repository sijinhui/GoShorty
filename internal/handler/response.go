package handler

import (
	"net/http"

	"GoShorty/internal/domain"

	"github.com/gin-gonic/gin"
)

// APIResponse 标准成功响应
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// APIError 标准错误响应
type APIError struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
}

// PaginatedResponse 分页响应
type PaginatedResponse struct {
	Success    bool           `json:"success"`
	Data       interface{}    `json:"data"`
	Pagination PaginationMeta `json:"pagination"`
}

// PaginationMeta 分页元数据
type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

// 错误码映射
var errorCodeMap = map[error]string{
	domain.ErrLinkNotFound:       "LINK_NOT_FOUND",
	domain.ErrLinkExpired:        "LINK_EXPIRED",
	domain.ErrLinkInactive:       "LINK_INACTIVE",
	domain.ErrShortCodeExists:    "SHORT_CODE_EXISTS",
	domain.ErrInvalidShortCode:   "INVALID_SHORT_CODE",
	domain.ErrInvalidURL:         "INVALID_URL",
	domain.ErrUserNotFound:       "USER_NOT_FOUND",
	domain.ErrUserExists:         "USER_EXISTS",
	domain.ErrInvalidCredentials: "INVALID_CREDENTIALS",
	domain.ErrSessionNotFound:    "SESSION_NOT_FOUND",
	domain.ErrSessionExpired:     "SESSION_EXPIRED",
	domain.ErrUnauthorized:       "UNAUTHORIZED",
	domain.ErrForbidden:          "FORBIDDEN",
	domain.ErrInternalServer:     "INTERNAL_ERROR",
}

// HTTP状态码映射
var errorStatusMap = map[error]int{
	domain.ErrLinkNotFound:       http.StatusNotFound,
	domain.ErrLinkExpired:        http.StatusGone,
	domain.ErrLinkInactive:       http.StatusGone,
	domain.ErrShortCodeExists:    http.StatusConflict,
	domain.ErrInvalidShortCode:   http.StatusBadRequest,
	domain.ErrInvalidURL:         http.StatusBadRequest,
	domain.ErrUserNotFound:       http.StatusNotFound,
	domain.ErrUserExists:         http.StatusConflict,
	domain.ErrInvalidCredentials: http.StatusUnauthorized,
	domain.ErrSessionNotFound:    http.StatusUnauthorized,
	domain.ErrSessionExpired:     http.StatusUnauthorized,
	domain.ErrUnauthorized:       http.StatusUnauthorized,
	domain.ErrForbidden:          http.StatusForbidden,
	domain.ErrInternalServer:     http.StatusInternalServerError,
}

// RespondError 统一错误响应处理
func RespondError(c *gin.Context, err error) {
	status := errorStatusMap[err]
	if status == 0 {
		status = http.StatusInternalServerError
	}

	code := errorCodeMap[err]
	if code == "" {
		code = "INTERNAL_ERROR"
	}

	c.JSON(status, APIError{
		Success: false,
		Error:   err.Error(),
		Code:    code,
	})
}

// RespondSuccess 统一成功响应处理
func RespondSuccess(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// RespondPaginated 统一分页响应处理
func RespondPaginated(c *gin.Context, data interface{}, pagination PaginationMeta) {
	c.JSON(http.StatusOK, PaginatedResponse{
		Success:    true,
		Data:       data,
		Pagination: pagination,
	})
}
