import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/store/adapters/themeAdapter";

export default function ThemeToggle() {
  const { theme, toggleTheme, accentRgb, glowEnabled } = useTheme();

  const trackClass =
    theme === "light"
      ? "w-11 h-6 neon-switch-light peer-focus:outline-none rounded-full transition-colors"
      : "w-11 h-6 neon-switch-dark peer-focus:outline-none rounded-full transition-colors";

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={theme === "light"}
        onChange={toggleTheme}
        aria-label="Toggle theme"
      />

      <div className={trackClass} />

      <span
        className="absolute left-1 top-0.5 w-5 h-5 bg-white rounded-full shadow transform peer-checked:translate-x-5 transition-transform flex items-center justify-center toggle-outer-ring"
        style={{
          boxShadow: `0 0 6px rgba(${accentRgb}, ${glowEnabled ? 0.28 : 0}), 0 0 18px rgba(${accentRgb}, ${glowEnabled ? 0.12 : 0})`,
          border: `1px solid rgba(${accentRgb}, 0.08)`,
        }}
      >
        {theme === "light" ? (
          <Sun className="w-3 h-3 text-black" />
        ) : (
          <Moon className="w-3 h-3 text-black" />
        )}
      </span>
    </label>
  );
}
