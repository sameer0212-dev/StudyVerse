import {
    AppThemes,
    type AppTheme,
    type ThemeId,
} from '@/constants/theme';
import { createContext, useContext, useState } from 'react';

type ThemeContextType = {
  theme: AppTheme;
  themeId: ThemeId;
  setTheme: (themeId: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeId, setTheme] = useState<ThemeId>('webHero');

  const theme = AppThemes[themeId];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeId,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useAppTheme must be used inside ThemeProvider'
    );
  }

  return context;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}