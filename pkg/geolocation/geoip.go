package geolocation

import (
	"net"
)

// Location 表示地理位置信息
type Location struct {
	Country   string
	City      string
	Latitude  float64
	Longitude float64
}

// GeoIPResolver 地理位置解析器接口
type GeoIPResolver interface {
	Resolve(ip string) (*Location, error)
}

// SimpleGeoIPResolver 简单的GeoIP解析器（用于开发）
// 生产环境应该使用MaxMind GeoIP2数据库
type SimpleGeoIPResolver struct{}

// NewSimpleGeoIPResolver 创建一个简单的GeoIP解析器
func NewSimpleGeoIPResolver() *SimpleGeoIPResolver {
	return &SimpleGeoIPResolver{}
}

// Resolve 解析IP地址的地理位置
// 简化版本：返回默认值，实际应该使用GeoIP2数据库
func (r *SimpleGeoIPResolver) Resolve(ipStr string) (*Location, error) {
	// 验证IP地址格式
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return &Location{
			Country: "Unknown",
			City:    "Unknown",
		}, nil
	}

	// 检查是否是本地IP
	if ip.IsLoopback() || ip.IsPrivate() {
		return &Location{
			Country: "Local",
			City:    "Local",
		}, nil
	}

	// 简化版本：返回默认值
	// TODO: 集成MaxMind GeoIP2数据库进行真实的地理位置解析
	return &Location{
		Country: "CN", // 默认中国
		City:    "Unknown",
	}, nil
}
