import { ConfigProvider, theme as antdTheme } from 'antd';
import { useThemeStore } from '../store/themeStore';
import type { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useThemeStore();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === 'dark'
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: theme === 'dark' ? '#7a8a99' : '#2563eb', // Matching --accent-primary from index.css
          colorInfo: theme === 'dark' ? '#7a8eb8' : '#3b82f6', // Matching --info
          colorSuccess: theme === 'dark' ? '#6b8e7f' : '#10b981', // Matching --success
          colorWarning: theme === 'dark' ? '#b8956a' : '#f59e0b', // Matching --warning
          colorError: theme === 'dark' ? '#b87a7a' : '#ef4444', // Matching --error
          colorBgBase: theme === 'dark' ? '#121212' : '#ffffff', // Matching --bg-primary
          colorBgContainer: theme === 'dark' ? '#1e1e1e' : '#ffffff', // Card background
          colorBgLayout: theme === 'dark' ? '#121212' : '#f3f4f6', // App background
          colorFillTertiary: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', // <Text code> background
          colorBorder: theme === 'dark' ? '#3a3a3a' : '#d1d5db', // --border-subtle / medium
          colorBorderSecondary: theme === 'dark' ? '#2d2d2d' : '#e5e7eb', // --border-subtle
          colorText: theme === 'dark' ? '#f5f5f5' : '#111827', // --text-primary
          colorTextSecondary: theme === 'dark' ? '#a0a0a0' : '#4b5563', // --text-secondary
          colorTextTertiary: theme === 'dark' ? '#8a8a8a' : '#6b7280', // --text-tertiary
          colorTextHeading: theme === 'dark' ? '#f5f5f5' : '#111827', // --text-primary (headings)
          colorTextDescription: theme === 'dark' ? '#a0a0a0' : '#6b7280', // --text-secondary (descriptions)
          boxShadow: theme === 'dark' 
            ? '0 10px 15px rgba(0, 0, 0, 0.5)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)', // --shadow-lg / md
        },
        components: {
          Table: {
            colorBgContainer: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            headerBg: theme === 'dark' ? '#252525' : '#f9fafb',
            headerSortActiveBg: theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
            headerSortHoverBg: theme === 'dark' ? '#2d2d2d' : '#e8e8e8',
            fixedHeaderSortActiveBg: theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
            bodySortBg: theme === 'dark' ? '#1a1a1a' : '#fafafa',
            rowHoverBg: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
            borderColor: theme === 'dark' ? '#3a3a3a' : '#e5e7eb',
            headerFilterHoverBg: theme === 'dark' ? '#2d2d2d' : '#e8e8e8',
            colorFillAlter: theme === 'dark' ? '#252525' : '#fafafa',
            stickyScrollBarBg: theme === 'dark' ? '#4a4a4a' : 'rgba(0, 0, 0, 0.25)',
          },
          Card: {
            colorBgContainer: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            headerBg: theme === 'dark' ? '#252525' : '#ffffff',
          },
          Popconfirm: {
            colorBgElevated: theme === 'dark' ? '#252525' : '#ffffff',
          },
          Descriptions: {
            colorBgContainer: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            labelBg: theme === 'dark' ? '#252525' : '#fafafa',
            colorSplit: theme === 'dark' ? '#3a3a3a' : '#f0f0f0',
          },
          Tag: {
            defaultBg: theme === 'dark' ? '#252525' : '#fafafa',
            defaultColor: theme === 'dark' ? '#e0e0e0' : '#333333',
          },
          Statistic: {},
          Pagination: {
            colorBgContainer: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            colorBgTextHover: theme === 'dark' ? '#2a2a2a' : '#f3f4f6',
            colorBgTextActive: theme === 'dark' ? '#2d2d2d' : '#e8e8e8',
          },
          Typography: {
            colorTextDescription: theme === 'dark' ? '#a0a0a0' : '#6b7280',
            colorLink: theme === 'dark' ? '#7a8eb8' : '#2563eb',
            colorLinkHover: theme === 'dark' ? '#8a9ec8' : '#1d4ed8',
          }
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
}
