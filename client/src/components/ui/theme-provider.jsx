import { useTheme } from '@/contexts/ThemeContext';

export const ThemeProvider = ({ children }) => {
  return children;
};

export const useThemeMode = () => {
  return useTheme();
};
