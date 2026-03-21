import { Moon, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleTheme } from '@/features/user/preferencesSlice';
import { Button } from '@/components/ui/button';

export function ThemeToggle(): JSX.Element {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.preferences.theme);

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={() => dispatch(toggleTheme())}
      aria-label='Toggle theme'
      title='Toggle theme'
    >
      {theme === 'dark' ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
    </Button>
  );
}
