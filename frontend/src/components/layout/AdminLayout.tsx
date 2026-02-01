import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} />

      <div style={{
        marginLeft: '250px',
        flex: 1,
        background: '#f5f5f5',
      }}>
        <main style={{
          padding: '2rem',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
