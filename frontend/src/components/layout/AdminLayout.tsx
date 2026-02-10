import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { useResponsive } from '../../hooks/useResponsive';
import { MenuOutlined } from '@ant-design/icons';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const compact = isMobile || isTablet;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <Sidebar
        onLogout={handleLogout}
        isMobile={isMobile}
        isTablet={isTablet}
        drawerOpen={drawerOpen}
        onDrawerClose={() => setDrawerOpen(false)}
      />

      <div style={{
        marginLeft: isDesktop ? '250px' : 0,
        flex: 1,
        background: 'var(--bg-primary)',
      }}>
        {/* Mobile/Tablet top bar */}
        {compact && (
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '1.125rem',
              }}
            >
              <MenuOutlined />
            </button>
            <span style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}>
              GoShorty
            </span>
          </div>
        )}

        <main style={{
          padding: compact ? '1rem' : '2rem',
          maxWidth: '1400px',
          margin: '0 auto',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
