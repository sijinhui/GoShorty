import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Drawer } from 'antd';
import { useThemeStore } from '../../store/themeStore';

interface SidebarProps {
  onLogout: () => void;
  isMobile?: boolean;
  isTablet?: boolean;
  drawerOpen?: boolean;
  onDrawerClose?: () => void;
}

export default function Sidebar({ onLogout, isMobile, isTablet, drawerOpen, onDrawerClose }: SidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();

  const compact = isMobile || isTablet;

  // Close drawer on route change
  useEffect(() => {
    if (compact && drawerOpen) {
      onDrawerClose?.();
    }
  }, [location.pathname]);

  const menuItems = [
    { path: '/admin/dashboard', label: '📊 仪表盘' },
    { path: '/admin/links', label: '🔗 链接管理' },
    { path: '/admin/link-expiry', label: '⏰ 过期管理' },
    { path: '/admin/api-keys', label: '🔑 API 密钥' },
    { path: '/admin/settings', label: '⚙️ 系统设置' },
  ];

  const isMenuActive = (path: string) => {
    if (path === '/admin/links') {
      return location.pathname === path || location.pathname.startsWith('/admin/links/');
    }
    return location.pathname === path;
  };

  const sidebarContent = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!compact && (
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
          }}>
            GoShorty
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem',
            fontFamily: 'var(--font-body)',
          }}>
            短链接管理系统
          </p>
        </div>
      )}

      <nav style={{ flex: 1 }}>
        {menuItems.map((item, index) => {
          const isActive = isMenuActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '0.875rem 1.5rem',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                transition: 'all var(--transition-base)',
                fontFamily: 'var(--font-body)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.9375rem',
                animation: compact ? 'none' : `slideIn 0.3s ease-out ${index * 0.05}s backwards`,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div style={{
        padding: '0 1.5rem',
        marginTop: 'auto',
        marginBottom: compact ? '1rem' : '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        <button
          onClick={(e) => toggleTheme(e)}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            fontFamily: 'var(--font-body)',
            transition: 'all var(--transition-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? '亮色模式' : '暗色模式'}
        </button>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            background: 'var(--bg-hover)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            fontFamily: 'var(--font-body)',
            transition: 'all var(--transition-base)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          🚪 退出登录
        </button>
      </div>
    </div>
  );

  if (compact) {
    return (
      <Drawer
        title="GoShorty"
        placement="left"
        onClose={onDrawerClose}
        open={drawerOpen}
        width={280}
        styles={{
          body: { padding: 0 },
          header: {
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            borderBottom: '1px solid var(--border-subtle)',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <div style={{
      width: '250px',
      background: 'var(--bg-elevated)',
      borderRight: '1px solid var(--border-subtle)',
      color: 'var(--text-primary)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: '1.5rem 0',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-lg)',
    }}>
      {sidebarContent}
    </div>
  );
}