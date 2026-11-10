import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";
/** Brand kit v5: dark is the default mode; a stored choice overrides it. */
export const DEFAULT_THEME: Theme = "dark";
/**
 * Versioned with the brand kit: v5 made dark the default, so choices saved under the old key
 * ("trellis-theme", when light was the default) are ignored and everyone starts on dark.
 */
const STORAGE_KEY = "trellis-theme-v5";
/** Browser chrome colour per theme: the v5 ground colours (trellis-teal.900, neutral.50). */
const THEME_COLOR: Record<Theme, string> = { dark: "#06343a", light: "#f4f7f8" };

/**
 * Runs in <head> before paint so the stored theme applies without a flash of the default one.
 * Keep in sync with {@link DEFAULT_THEME} and {@link STORAGE_KEY}.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="light"&&t!=="dark")t="${DEFAULT_THEME}";var d=document.documentElement;d.classList.toggle("dark",t==="dark");d.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"${THEME_COLOR.dark}":"${THEME_COLOR.light}");}catch(e){}})();`;

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  // Do not touch the <html> class until the stored choice is read, or the default would flash over it.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") setTheme(stored);
    } catch {
      /* Theme storage is optional. */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  }, [theme, loaded]);
  const updateTheme = (value: Theme) => {
    setTheme(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* Optional preference. */
    }
  };
  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? <Moon /> : <Sun />}
    </Button>
  );
}
