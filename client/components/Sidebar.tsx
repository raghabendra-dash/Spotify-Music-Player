import React, { useState } from "react";
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Clock,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/adapters/authAdapter";
import { useTheme } from "@/store/adapters/themeAdapter";
import { toast } from "sonner";
import AnimatedLogo from "@/components/AnimatedLogo";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onShowAuthModal: (mode: "login" | "signup") => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  currentPage,
  onPageChange,
  onShowAuthModal,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const { theme } = useTheme();
  const [isQuickAccessExpanded, setIsQuickAccessExpanded] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to sign out");
    }
  };

  const sidebarItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "library", label: "Your Library", icon: Library, requireAuth: true },
  ];

  const playlistItems = [
    { id: "favorites", label: "Liked Songs", icon: Heart, requireAuth: true },
    { id: "recent", label: "Recently Played", icon: Clock, requireAuth: true },
  ];

  const sidebarBg =
    theme === "dark"
      ? "bg-gradient-to-b from-gray-900 to-blue-950 text-white"
      : "bg-gradient-to-b from-gray-100 to-blue-200 text-black";

  const activeItemBg = theme === "dark" ? "bg-blue-800" : "bg-blue-300";
  const hoverItemBg =
    theme === "dark" ? "hover:bg-blue-800" : "hover:bg-blue-300";

  return (
    <div className={`w-64 flex flex-col h-full ${sidebarBg}`}>
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <AnimatedLogo size={36} />
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const isDisabled = item.requireAuth && !currentUser;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isDisabled) {
                  onShowAuthModal("login");
                } else {
                  onPageChange(item.id);
                }
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                isActive ? activeItemBg : hoverItemBg
              } ${isDisabled ? "opacity-60" : ""}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div
        className={`mx-6 my-4 border-t ${theme === "dark" ? "border-blue-800" : "border-blue-300"}`}
      ></div>

      {/* Quick Access */}
      <div className="px-6 space-y-2">
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-medium ${theme === "dark" ? "text-blue-200" : "text-blue-900"}`}
          >
            Quick Access
          </span>
          {currentUser && (
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 w-6 p-0 ${theme === "dark" ? "text-blue-200 hover:text-white" : "text-blue-900 hover:text-black"}`}
              onClick={() => setIsQuickAccessExpanded(!isQuickAccessExpanded)}
            >
              {/* <Plus className="w-4 h-4" /> */}
              {isQuickAccessExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {isQuickAccessExpanded &&
          playlistItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isDisabled = item.requireAuth && !currentUser;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isDisabled) {
                    onShowAuthModal("login");
                  } else {
                    onPageChange(item.id);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  isActive ? activeItemBg : hoverItemBg
                } ${isDisabled ? "opacity-60" : ""}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
      </div>

      <div className="mt-auto h-6" aria-hidden="true" />
    </div>
  );
}
