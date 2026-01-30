package plugin

import (
	"sync"

	"go.uber.org/zap"
)

// Manager 插件管理器
type Manager struct {
	plugins      map[string]Plugin
	linkPlugins  []LinkPlugin
	expiryPlugin ExpiryPlugin
	mu           sync.RWMutex
	logger       *zap.Logger
}

// NewManager 创建一个新的插件管理器
func NewManager(logger *zap.Logger) *Manager {
	return &Manager{
		plugins:     make(map[string]Plugin),
		linkPlugins: make([]LinkPlugin, 0),
		logger:      logger,
	}
}

// Register 注册插件
func (m *Manager) Register(plugin Plugin) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	name := plugin.Name()
	if _, exists := m.plugins[name]; exists {
		m.logger.Warn("plugin already registered", zap.String("name", name))
		return nil
	}

	// 初始化插件
	if err := plugin.Init(); err != nil {
		m.logger.Error("failed to initialize plugin", zap.String("name", name), zap.Error(err))
		return err
	}

	m.plugins[name] = plugin

	// 根据插件类型分类存储
	if linkPlugin, ok := plugin.(LinkPlugin); ok {
		m.linkPlugins = append(m.linkPlugins, linkPlugin)
	}

	if expiryPlugin, ok := plugin.(ExpiryPlugin); ok {
		m.expiryPlugin = expiryPlugin
	}

	m.logger.Info("plugin registered",
		zap.String("name", name),
		zap.String("version", plugin.Version()),
	)

	return nil
}

// GetPlugin 获取插件
func (m *Manager) GetPlugin(name string) (Plugin, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	plugin, exists := m.plugins[name]
	return plugin, exists
}

// GetExpiryPlugin 获取过期策略插件
func (m *Manager) GetExpiryPlugin() ExpiryPlugin {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.expiryPlugin
}

// GetLinkPlugins 获取所有链接插件
func (m *Manager) GetLinkPlugins() []LinkPlugin {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.linkPlugins
}
