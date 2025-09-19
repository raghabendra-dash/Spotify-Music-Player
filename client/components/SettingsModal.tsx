import React from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/store/adapters/themeAdapter";
import { useAuth } from "@/store/adapters/authAdapter";

export default function SettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    theme,
    toggleTheme,
    accentColor,
    setAccentColor,
    accentRgb,
    glowEnabled,
    setGlowEnabled,
    setTheme,
  } = useTheme();
  const { currentUser, logout } = useAuth();

  if (!isOpen) return null;

  const accentOptions = ["#60a5fa", "#06b6d4", "#7c3aed", "#06b6a4", "#f472b6"];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 text-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Theme</div>
              <div className="text-xs text-gray-400">
                Toggle light / dark theme
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTheme("light")}
              >
                Light
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTheme("dark")}
              >
                Dark
              </Button>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Accent Color</div>
            <div className="text-xs text-gray-400 mb-2">
              Choose an accent color for neon highlights
            </div>
            <div className="flex items-center gap-2">
              {accentOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  style={{ background: c }}
                  className={`w-8 h-8 rounded-full border-2 ${accentColor === c ? "ring-2 ring-white/30" : "ring-0"}`}
                  aria-label={`Select ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Glow Effects</div>
              <div className="text-xs text-gray-400">
                Enable or disable neon glows
              </div>
            </div>
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setGlowEnabled(!glowEnabled)}
                className={glowEnabled ? "bg-white/10" : ""}
              >
                {glowEnabled ? "On" : "Off"}
              </Button>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium">Account</div>
            <div className="text-xs text-slate-300">
              {currentUser?.displayName || currentUser?.email || "Guest"}
            </div>
          </div>

          {currentUser && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="bg-red-600"
              >
                Sign Out
              </Button>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAccentColor("#60a5fa");
                setGlowEnabled(true);
              }}
            >
              Reset Theme
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
