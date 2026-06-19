import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cours_theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
      }
    } catch {
      /* noop */
    }
  }, []);

  // Reflect onto <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${theme}`);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem("cours_theme", theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        lineHeight: 1,
        transition: "background 0.15s, transform 0.15s",
        flexShrink: 0,
        ...style,
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
