package validator

import (
	"net/url"
	"strings"
)

// ValidateURL 验证URL是否有效
func ValidateURL(rawURL string) error {
	// 检查URL是否为空
	if strings.TrimSpace(rawURL) == "" {
		return ErrEmptyURL
	}

	// 解析URL
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return ErrInvalidURL
	}

	// 检查scheme是否为http或https
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return ErrInvalidScheme
	}

	// 检查是否有host
	if parsedURL.Host == "" {
		return ErrMissingHost
	}

	return nil
}

// NormalizeURL 规范化URL（添加scheme等）
func NormalizeURL(rawURL string) string {
	rawURL = strings.TrimSpace(rawURL)

	// 如果没有scheme，默认添加https
	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "https://" + rawURL
	}

	return rawURL
}
