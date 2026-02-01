import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          // 更新 HTML 元素的 data-theme 属性
          document.documentElement.setAttribute('data-theme', newTheme);
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        // 更新 HTML 元素的 data-theme 属性
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// 初始化主题
export const initTheme = () => {
  const storedTheme = localStorage.getItem('theme-storage');
  if (storedTheme) {
    try {
      const { state } = JSON.parse(storedTheme);
      const theme = state?.theme || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
};
