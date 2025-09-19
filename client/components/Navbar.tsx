import React from "react";
import { Search, Sun, Moon } from "lucide-react";
import { useTheme } from "@/store/adapters/themeAdapter";
import { useAuth } from "@/store/adapters/authAdapter";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar({
  onSearch,
  onNavLeft,
  onNavRight,
}: {
  onSearch?: (q: string) => void;
  onNavLeft?: () => void;
  onNavRight?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch (err) {
      console.error("Sign out failed", err);
      alert("Failed to sign out");
    }
  };

  const navBg =
    theme === "dark"
      ? "bg-gray-900 text-white"
      : "bg-gradient-to-r from-blue-100 to-blue-200 text-black";

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        onNavLeft?.();
      } else if (e.key === "ArrowRight") {
        onNavRight?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNavLeft, onNavRight]);

  return (
    <div
      className={`flex items-center justify-between py-3 fixed top-0 left-0 right-0 md:left-64 z-40 px-6 ${navBg}`}
    >
      <div className="flex items-center space-x-7">
        <>
          {/* Spotify-like nav arrows */}
          <button
            aria-label="Navigate left"
            onClick={() => onNavLeft?.()}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              theme === "dark"
                ? "bg-black/70 hover:bg-black/90 text-white"
                : "bg-blue-300 hover:bg-blue-400 text-black"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            aria-label="Navigate right"
            onClick={() => onNavRight?.()}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              theme === "dark"
                ? "bg-black/70 hover:bg-black/90 text-white"
                : "bg-blue-300 hover:bg-blue-400 text-black"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </>
      </div>

      <div className="flex-1 mx-6" />

      <div className="flex items-center space-x-4">
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>

        <div className="relative">
          <button
            aria-label="Open account menu"
            onClick={() => setMenuOpen((s) => !s)}
            className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white focus:outline-none shadow-lg shadow-blue-500/50`}
          >
            {currentUser
              ? currentUser.displayName
                ? currentUser.displayName.charAt(0)
                : "U"
              : "G"}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="text-sm font-medium">
                  {currentUser?.displayName || "Guest User"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {(currentUser as any)?.email || ""}
                </div>
              </div>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  setMenuOpen(false);
                  window.dispatchEvent(
                    new CustomEvent("navigate", {
                      detail: { page: "settings" },
                    }),
                  );
                }}
              >
                Settings
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
