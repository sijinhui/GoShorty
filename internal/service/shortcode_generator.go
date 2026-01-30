package service

import (
	"crypto/rand"
	"errors"
	"math/big"
	"regexp"
)

const (
	// 安全字符集（移除容易混淆的字符）
	// 移除了容易混淆的字符：
	// - I, L, O, S, Z (大写)
	// - i, l, o, s, z (小写)
	// - 0, 1, 2, 5 (数字)
	// 保留了不易混淆的大小写字母和数字，共48个字符
	safeChars = "346789abcdefghjkmnpqrtuvwxyABCDEFGHJKMNPQRTUVWXY"

	// Base62字符集（包含所有字母和数字，保留用于特殊用途）
	base62Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

	// 默认短码长度
	defaultShortCodeLength = 6
	// 短码最小长度
	minShortCodeLength = 3
	// 短码最大长度
	maxShortCodeLength = 20
)

var (
	// 短码格式验证（只允许字母和数字）
	shortCodeRegex = regexp.MustCompile(`^[a-zA-Z0-9]+$`)

	ErrInvalidShortCodeLength = errors.New("short code length must be between 3 and 20")
	ErrInvalidShortCodeFormat = errors.New("short code can only contain letters and numbers")
)

// ShortCodeGenerator 短码生成器接口
type ShortCodeGenerator interface {
	Generate() (string, error)
	Validate(code string) error
}

// Base62Generator 基于Base62的短码生成器
type Base62Generator struct {
	length int
}

// NewBase62Generator 创建一个新的Base62生成器
func NewBase62Generator(length int) *Base62Generator {
	if length < minShortCodeLength || length > maxShortCodeLength {
		length = defaultShortCodeLength
	}
	return &Base62Generator{length: length}
}

// Generate 生成一个随机的短码（使用安全字符集）
func (g *Base62Generator) Generate() (string, error) {
	result := make([]byte, g.length)
	for i := 0; i < g.length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(safeChars))))
		if err != nil {
			return "", err
		}
		result[i] = safeChars[num.Int64()]
	}
	return string(result), nil
}

// Validate 验证短码格式
func (g *Base62Generator) Validate(code string) error {
	if len(code) < minShortCodeLength || len(code) > maxShortCodeLength {
		return ErrInvalidShortCodeLength
	}

	if !shortCodeRegex.MatchString(code) {
		return ErrInvalidShortCodeFormat
	}

	return nil
}

// EncodeBase62 将数字编码为Base62字符串
func EncodeBase62(num int64) string {
	if num == 0 {
		return string(base62Chars[0])
	}

	result := ""
	base := int64(len(base62Chars))

	for num > 0 {
		remainder := num % base
		result = string(base62Chars[remainder]) + result
		num = num / base
	}

	return result
}

// DecodeBase62 将Base62字符串解码为数字
func DecodeBase62(encoded string) (int64, error) {
	var result int64
	base := int64(len(base62Chars))

	for _, char := range encoded {
		var value int64 = -1
		for i, c := range base62Chars {
			if c == char {
				value = int64(i)
				break
			}
		}

		if value == -1 {
			return 0, ErrInvalidShortCodeFormat
		}

		result = result*base + value
	}

	return result, nil
}
