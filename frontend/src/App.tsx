import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Links from './pages/Links';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import LinkExpiry from './pages/LinkExpiry';
import AdminLayout from './components/layout/AdminLayout';
import { useAuthStore } from './store/authStore';
import AntdStaticMethods from './components/AntdStaticMethods';
import ThemeProvider from './providers/ThemeProvider';

// 受保护的路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 认证检查期间显示加载指示器
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--page-background)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 装饰性网格背景 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--grid-background)',
            backgroundSize: '40px 40px',
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />

        {/* 主加载内容 */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* 加载动画容器 */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}>
            {/* 外层脉冲圆环 */}
            <div
              style={{
                position: 'absolute',
                inset: '-20px',
                borderRadius: '50%',
                border: '2px solid var(--accent-primary)',
                opacity: 0.2,
                animation: 'ripple 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '-20px',
                borderRadius: '50%',
                border: '2px solid var(--accent-primary)',
                opacity: 0.2,
                animation: 'ripple 2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s',
              }}
            />

            {/* 中心旋转圆环 */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '3px solid var(--border-subtle)',
                borderTopColor: 'var(--accent-primary)',
                animation: 'spin 1s linear infinite',
                boxShadow: 'var(--shadow-lg)',
              }}
            />

            {/* 中心点 */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                animation: 'float 2s ease-in-out infinite',
                boxShadow: '0 0 20px var(--accent-primary)',
              }}
            />
          </div>

          {/* 加载文字 */}
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
              animation: 'fadeIn 0.6s ease-out',
            }}
          >
            验证会话中
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--text-tertiary)',
              animation: 'fadeIn 0.8s ease-out',
            }}
          >
            正在确认您的身份...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 保存当前路径，登录成功后重定向回来
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?redirect=${redirectPath}`} replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function App() {
  return (
    <AntdApp>
      <AntdStaticMethods />
      <ThemeProvider>
        <BrowserRouter>
        <Routes>
          {/* 公开首页 */}
          <Route path="/" element={<Home />} />

          {/* 管理后台登录页面 */}
          <Route path="/admin/login" element={<Login />} />

          {/* 管理后台路由 */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/links"
            element={
              <ProtectedRoute>
                <Links />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/link-expiry"
            element={
              <ProtectedRoute>
                <LinkExpiry />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </AntdApp>
  );
}

export default App;
