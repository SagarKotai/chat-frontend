import { useEffect, type PropsWithChildren } from 'react';
import { useAppSelector } from '@/app/hooks';

export function ThemeProvider({ children }: PropsWithChildren): JSX.Element {
  const theme = useAppSelector((state) => state.preferences.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
}
