import type { RootState } from '@/app/store';

export const selectTheme = (state: RootState): 'light' | 'dark' => state.preferences.theme;
