import { useThemeContext } from './theme-context';

export function useColorScheme() {
  return useThemeContext().theme;
}
