import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
  setTheme: (theme: Theme) => void;
}

// 检查浏览器是否支持 View Transition API
const supportsViewTransition = () => {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
};

// 执行主题切换动画
const toggleThemeWithAnimation = (
  newTheme: Theme,
  clickPosition?: { x: number; y: number }
) => {
  // 如果浏览器不支持 View Transition API 或没有点击位置，直接切换
  if (!supportsViewTransition() || !clickPosition) {
    document.documentElement.setAttribute('data-theme', newTheme);
    return;
  }

  const { x, y } = clickPosition;

  // 计算从点击位置到屏幕角落的最大距离
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // @ts-ignore - View Transition API 类型定义可能不完整
  const transition = document.startViewTransition(() => {
    document.documentElement.setAttribute('data-theme', newTheme);
  });

  // 等待 transition 准备好后执行动画
  transition.ready.then(() => {
    // 定义 clipPath 动画关键帧
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`,
    ];
    const isDark = newTheme === 'dark';
    // 新主题从点击位置扩散出来，覆盖旧主题
    document.documentElement.animate(
      {
        clipPath: isDark ? [...clipPath].reverse() : clipPath,
      },
      {
        duration: 500,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  });
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: (event?: React.MouseEvent) => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        // 获取点击位置
        const clickPosition = event
          ? { x: event.clientX, y: event.clientY }
          : undefined;

        // 执行动画切换
        toggleThemeWithAnimation(newTheme, clickPosition);

        // 更新状态
        set({ theme: newTheme });
      },
      setTheme: (theme) => {
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
