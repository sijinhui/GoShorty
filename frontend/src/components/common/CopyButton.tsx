import { useState } from 'react';
import { notification } from '../AntdStaticMethods';
import { message } from 'antd';

interface CopyButtonProps {
  text: string;
  successMessage?: string;
  buttonText?: string;
  copiedText?: string;
  variant?: 'primary' | 'secondary' | 'inline';
  useMessage?: boolean;
  onCopy?: () => void;
}

export default function CopyButton({
  text,
  successMessage = '已复制到剪贴板',
  buttonText = '复制',
  copiedText = '✓ 已复制',
  variant = 'primary',
  useMessage = false,
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (useMessage) {
        messageApi.success(successMessage);
      } else {
        notification.success({
          title: '复制成功',
          description: successMessage,
          placement: 'topRight',
          duration: 3,
          showProgress: true,
        });
      }

      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      if (useMessage) {
        messageApi.error('无法访问剪贴板');
      } else {
        notification.error({
          title: '复制失败',
          description: '无法访问剪贴板',
          placement: 'topRight',
          duration: 3,
        });
      }
    }
  };

  const getButtonStyles = () => {
    const baseStyles = {
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '600' as const,
      fontFamily: 'var(--font-body)',
      transition: 'all var(--transition-base)',
      whiteSpace: 'nowrap' as const,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          padding: '0.875rem 1.75rem',
          background: copied ? 'var(--success)' : 'var(--accent-primary)',
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-md)',
        };
      case 'secondary':
        return {
          ...baseStyles,
          padding: '0.5rem 1rem',
          background: copied ? 'var(--success)' : 'var(--accent-primary)',
          color: '#ffffff',
          borderRadius: '6px',
        };
      case 'inline':
        return {
          ...baseStyles,
          padding: '0.375rem 0.75rem',
          background: copied ? 'var(--success)' : 'var(--bg-secondary)',
          color: copied ? '#ffffff' : 'var(--accent-primary)',
          border: '1px solid',
          borderColor: copied ? 'var(--success)' : 'var(--border-subtle)',
          borderRadius: '6px',
        };
      default:
        return baseStyles;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (copied) return;

    if (variant === 'inline') {
      e.currentTarget.style.borderColor = 'var(--accent-primary)';
      e.currentTarget.style.background = 'var(--bg-hover)';
    } else {
      e.currentTarget.style.background = 'var(--accent-hover)';
      if (variant === 'primary') {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (copied) return;

    const styles = getButtonStyles();
    e.currentTarget.style.background = styles.background as string;
    if (variant === 'inline') {
      e.currentTarget.style.borderColor = 'var(--border-subtle)';
    }
    if (variant === 'primary') {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
    }
  };

  return (
    <>
      {useMessage && contextHolder}
      <button
        type="button"
        onClick={handleCopy}
        style={getButtonStyles()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {copied ? copiedText : buttonText}
      </button>
    </>
  );
}
