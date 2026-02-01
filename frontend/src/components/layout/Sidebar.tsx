import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', label: '📊 仪表盘', icon: '📊' },
    { path: '/admin/links', label: '🔗 链接管理', icon: '🔗' },
    { path: '/admin/analytics', label: '📈 统计分析', icon: '📈' },
    { path: '/admin/link-expiry', label: '⏰ 过期管理', icon: '⏰' },
    { path: '/admin/settings', label: '⚙️ 系统设置', icon: '⚙️' },
  ];

  return (
    <div style={{
      width: '250px',
      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: '1.5rem 0',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '0 1.5rem',
        marginBottom: '2rem',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
        }}>
          GoShorty
        </h1>
        <p style={{
          fontSize: '0.875rem',
          opacity: 0.8,
          marginTop: '0.25rem',
        }}>
          短链接管理系统
        </p>
      </div>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '0.75rem 1.5rem',
                color: 'white',
                textDecoration: 'none',
                background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                borderLeft: isActive ? '4px solid white' : '4px solid transparent',
                transition: 'all 0.2s',
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
        marginBottom: '2rem',
      }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            // border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          🚪 退出登录
        </button>
      </div>
    </div>
  );
}
