import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// 添加旋转动画样式
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-spinner]')) {
  spinnerStyle.setAttribute('data-spinner', 'true');
  document.head.appendChild(spinnerStyle);
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);
  const { login, isLoading, error, clearError, isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 获取重定向路径，如果没有则默认为 /admin
  const getRedirectPath = () => {
    const redirect = searchParams.get('redirect');
    return redirect ? decodeURIComponent(redirect) : '/admin';
  };

  // 组件挂载时检查登录状态
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 如果用户已登录，显示提示并在2秒后跳转
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setShowRedirectMessage(true);
      const timer = setTimeout(() => {
        navigate(getRedirectPath(), { replace: true });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ username, password });
      navigate(getRedirectPath());
    } catch (err) {
      // 错误已经在store中处理
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          GoShorty 登录
        </h1>

        {showRedirectMessage ? (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '1rem',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <div style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: '500' }}>
              您已登录
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              即将跳转到管理后台...
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                border: '2px solid transparent',
                borderBottomColor: '#28a745',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}></div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                background: '#fee',
                color: '#c33',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
            }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isLoading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
