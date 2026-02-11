package handler

import (
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"GoShorty/internal/domain"
	"GoShorty/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// APIHandler API处理器
type APIHandler struct {
	linkService      service.LinkService
	analyticsService service.AnalyticsService
	logger           *zap.Logger
}

// NewAPIHandler 创建一个新的APIHandler
func NewAPIHandler(
	linkService service.LinkService,
	analyticsService service.AnalyticsService,
	logger *zap.Logger,
) *APIHandler {
	return &APIHandler{
		linkService:      linkService,
		analyticsService: analyticsService,
		logger:           logger,
	}
}

// getClientIP 从请求中获取客户端IP地址
func getClientIP(c *gin.Context) string {
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.SplitN(xff, ",", 2)[0])
	}
	if xri := c.GetHeader("X-Real-IP"); xri != "" {
		return xri
	}
	return c.ClientIP()
}

// buildShortURL 构建完整的短链接URL
func buildShortURL(c *gin.Context, shortCode string) string {
	return "http://" + c.Request.Host + "/" + shortCode
}

// linkResponse 构建链接创建的响应数据
func linkResponse(c *gin.Context, link *domain.Link) gin.H {
	return gin.H{
		"id":           link.ID,
		"short_code":   link.ShortCode,
		"original_url": link.OriginalURL,
		"short_url":    buildShortURL(c, link.ShortCode),
		"title":        link.Title,
		"created_at":   link.CreatedAt,
	}
}

// GetDashboardStats 获取仪表盘统计数据
func (h *APIHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.linkService.GetDashboardStats(c.Request.Context())
	if err != nil {
		h.logger.Error("Failed to get dashboard stats", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	RespondSuccess(c, stats, "")
}

// CreateLink 创建短链接
func (h *APIHandler) CreateLink(c *gin.Context) {
	var req struct {
		OriginalURL string `json:"original_url" binding:"required"`
		ShortCode   string `json:"short_code"`
		Title       string `json:"title"`
		ExpiresAt   string `json:"expires_at"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondBadRequest(c, "请填写原始链接")
		return
	}

	// 计算过期天数
	expiryDays := 0
	if req.ExpiresAt != "" {
		t, err := time.Parse("2006-01-02T15:04", req.ExpiresAt)
		if err == nil {
			if days := int(time.Until(t).Hours() / 24); days > 0 {
				expiryDays = days
			}
		}
	}

	h.logger.Info("creating link via API",
		zap.String("url", req.OriginalURL),
		zap.String("expires_at", req.ExpiresAt),
		zap.Int("expiry_days", expiryDays),
	)

	link, err := h.linkService.CreateLink(c.Request.Context(), &service.CreateLinkRequest{
		URL:             req.OriginalURL,
		CustomCode:      req.ShortCode,
		Title:           req.Title,
		UserID:          1,
		CreatedIP:       getClientIP(c),
		ExpiryDays:      expiryDays,
		BypassMinLength: true, // admin后台创建允许绕过最小长度限制
	})
	if err != nil {
		h.logger.Error("Failed to create link", zap.Error(err))
		RespondError(c, err)
		return
	}

	RespondSuccess(c, linkResponse(c, link), "短链接创建成功")
}

// GetLinks 获取链接列表
func (h *APIHandler) GetLinks(c *gin.Context) {
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	// 获取链接列表
	links, err := h.linkService.ListLinks(c.Request.Context(), limit, offset)
	if err != nil {
		h.logger.Error("Failed to get links", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	// 计算分页信息
	total := int64(len(links)) // 简化版本，实际应该查询总数
	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}
	hasNext := len(links) == limit
	hasPrev := page > 1

	pagination := PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    hasNext,
		HasPrev:    hasPrev,
	}

	RespondPaginated(c, links, pagination)
}

// DeleteLink 删除链接
func (h *APIHandler) DeleteLink(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		RespondBadRequest(c, "无效的链接ID")
		return
	}

	if err := h.linkService.DeleteLink(c.Request.Context(), id, 1); err != nil {
		h.logger.Error("Failed to delete link", zap.Error(err))
		RespondError(c, err)
		return
	}

	RespondSuccess(c, nil, "链接已删除")
}

// parsePageParams 从查询参数中解析分页参数
func parsePageParams(c *gin.Context) (page, limit int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	return
}

// GetLinkAnalytics 获取链接统计数据
func (h *APIHandler) GetLinkAnalytics(c *gin.Context) {
	linkID, err := strconv.ParseInt(c.Query("link_id"), 10, 64)
	if err != nil {
		RespondBadRequest(c, "无效的链接ID")
		return
	}

	// 获取链接信息
	link, err := h.linkService.GetByID(c.Request.Context(), linkID)
	if err != nil {
		RespondError(c, err)
		return
	}

	page, limit := parsePageParams(c)
	RespondSuccess(c, h.buildAnalyticsResponse(c, link, page, limit), "")
}

// GetLinkAnalyticsByShortCode 通过短码获取链接统计数据
func (h *APIHandler) GetLinkAnalyticsByShortCode(c *gin.Context) {
	shortCode := strings.TrimSpace(c.Param("shortCode"))
	shortCode = strings.TrimSuffix(shortCode, "+")
	if shortCode == "" {
		RespondBadRequest(c, "无效的短码")
		return
	}

	link, err := h.linkService.GetByShortCode(c.Request.Context(), shortCode)
	if err != nil {
		RespondError(c, err)
		return
	}

	page, limit := parsePageParams(c)
	RespondSuccess(c, h.buildAnalyticsResponse(c, link, page, limit), "")
}

func (h *APIHandler) buildAnalyticsResponse(c *gin.Context, link *domain.Link, page, limit int) gin.H {
	linkID := link.ID
	offset := (page - 1) * limit

	// 获取访问日志（分页）
	logs, err := h.analyticsService.GetAccessLogs(c.Request.Context(), linkID, limit, offset)
	if err != nil {
		h.logger.Error("Failed to get access logs", zap.Error(err))
		logs = []*domain.AccessLog{}
	}

	// 获取访问日志总数
	totalLogs, err := h.analyticsService.GetAccessLogCount(c.Request.Context(), linkID)
	if err != nil {
		h.logger.Error("Failed to get access log count", zap.Error(err))
		totalLogs = 0
	}

	// 获取国家统计
	countryStats, err := h.analyticsService.GetCountryStats(c.Request.Context(), linkID)
	if err != nil {
		h.logger.Error("Failed to get country stats", zap.Error(err))
		countryStats = make(map[string]int64)
	}

	totalPages := int(totalLogs) / limit
	if int(totalLogs)%limit > 0 {
		totalPages++
	}

	// 返回JSON格式的统计数据
	response := gin.H{
		"link":          link,
		"access_logs":   logs,
		"country_stats": countryStats,
		"pagination": PaginationMeta{
			Page:       page,
			Limit:      limit,
			Total:      totalLogs,
			TotalPages: totalPages,
			HasNext:    page < totalPages,
			HasPrev:    page > 1,
		},
	}

	return response
}

// CreatePublicLink 公开创建短链接（不需要认证）
func (h *APIHandler) CreatePublicLink(c *gin.Context) {
	var req struct {
		OriginalURL string `json:"original_url" binding:"required"`
		ShortCode   string `json:"short_code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondBadRequest(c, "请填写原始链接")
		return
	}

	link, err := h.linkService.CreateLink(c.Request.Context(), &service.CreateLinkRequest{
		URL:        req.OriginalURL,
		CustomCode: req.ShortCode,
		UserID:     1,
		CreatedIP:  getClientIP(c),
	})
	if err != nil {
		h.logger.Error("Failed to create public link", zap.Error(err))
		RespondError(c, err)
		return
	}

	RespondSuccess(c, linkResponse(c, link), "短链接创建成功")
}

// ExportLinks 导出所有链接为CSV
func (h *APIHandler) ExportLinks(c *gin.Context) {
	links, err := h.linkService.ListLinks(c.Request.Context(), 0, 0)
	if err != nil {
		h.logger.Error("Failed to get links for export", zap.Error(err))
		RespondError(c, domain.ErrInternalServer)
		return
	}

	// 设置响应头
	c.Writer.Header().Set("Content-Type", "text/csv; charset=utf-8")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=links_export_%s.csv", time.Now().Format("20060102_150405")))
	c.Writer.WriteHeader(200)

	// 写入UTF-8 BOM以支持Excel正确显示中文
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	// 创建CSV writer
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	// 写入表头
	if err := writer.Write([]string{"source", "target", "hits"}); err != nil {
		h.logger.Error("Failed to write CSV header", zap.Error(err))
		return
	}

	// 写入数据
	for _, link := range links {
		record := []string{
			link.ShortCode,
			link.OriginalURL,
			strconv.Itoa(link.ClickCount),
		}
		if err := writer.Write(record); err != nil {
			h.logger.Error("Failed to write CSV record", zap.Error(err))
			return
		}
	}
}

// ImportLinks 从CSV导入链接
func (h *APIHandler) ImportLinks(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		RespondBadRequest(c, "请上传CSV文件")
		return
	}
	defer file.Close()

	// 解析CSV
	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		h.logger.Error("Failed to read CSV file", zap.Error(err))
		RespondBadRequest(c, "CSV文件格式错误")
		return
	}

	if len(records) < 2 {
		RespondBadRequest(c, "CSV文件为空或格式不正确")
		return
	}

	// 验证表头
	header := records[0]
	if len(header) < 2 || header[0] != "source" || header[1] != "target" {
		RespondBadRequest(c, "CSV表头格式不正确，应为: source,target,hits")
		return
	}

	// 导入统计
	successCount := 0
	failCount := 0
	var errors []string

	// 跳过表头，处理数据行
	for i, record := range records[1:] {
		if len(record) < 2 {
			failCount++
			errors = append(errors, fmt.Sprintf("第%d行: 数据不完整", i+2))
			continue
		}

		shortCode := strings.TrimSpace(record[0])
		// 兼容带斜杠的短码格式，如 /NHj/
		shortCode = strings.Trim(shortCode, "/")
		originalURL := strings.TrimSpace(record[1])

		if shortCode == "" || originalURL == "" {
			failCount++
			errors = append(errors, fmt.Sprintf("第%d行: 短码或URL为空", i+2))
			continue
		}

		// 创建链接
		_, err := h.linkService.CreateLink(c.Request.Context(), &service.CreateLinkRequest{
			URL:             originalURL,
			CustomCode:      shortCode,
			UserID:          1,
			CreatedIP:       getClientIP(c),
			BypassMinLength: true, // 导入时允许绕过最小长度限制
		})

		if err != nil {
			failCount++
			errMsg := err.Error()
			if err == domain.ErrShortCodeExists {
				errMsg = "短码已存在"
			} else if err == domain.ErrInvalidURL {
				errMsg = "URL格式无效"
			} else if err == domain.ErrInvalidShortCode {
				errMsg = "短码格式无效"
			}
			errors = append(errors, fmt.Sprintf("第%d行 (%s): %s", i+2, shortCode, errMsg))
		} else {
			successCount++
		}
	}

	// 返回导入结果
	result := gin.H{
		"success_count": successCount,
		"fail_count":    failCount,
		"total":         len(records) - 1,
	}

	if len(errors) > 0 {
		// 返回所有错误信息
		result["errors"] = errors
	}

	message := fmt.Sprintf("导入完成：成功 %d 条，失败 %d 条", successCount, failCount)
	RespondSuccess(c, result, message)
}
