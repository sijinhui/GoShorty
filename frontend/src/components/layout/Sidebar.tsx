import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: '📊 仪表盘', icon: '📊' },
    { path: '/links', label: '🔗 链接管理', icon: '🔗' },
    { path: '/analytics', label: '📈 统计分析', icon: '📈' },
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

      <nav>
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
    </div>
  );
}
