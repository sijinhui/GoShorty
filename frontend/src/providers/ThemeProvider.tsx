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
          // Add other mappings if needed to match Tailwind/CSS vars
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
