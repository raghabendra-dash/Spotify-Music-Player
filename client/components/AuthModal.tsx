import React, { useMemo, useState } from "react";
import { X, Mail, Lock, User, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/store/adapters/authAdapter";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail, loginWithGoogle } = useAuth();

  React.useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const emailError = useMemo(() => {
    if (email && email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return "Please enter a valid email address.";
    }
    return null;
  }, [mode, email]);

  const passwordError = useMemo(() => {
    if (password && password && password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    return null;
  }, [mode, password]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailError || passwordError) {
      toast.error(
        emailError ||
          passwordError ||
          "Please fix the errors before submitting.",
      );
      return;
    }
    if (!email || !password) {
      toast.error("Please fill in all fields correctly.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        toast.success("Welcome back!");
      } else {
        await signUpWithEmail(email, password, displayName);
        toast.success("Account created successfully!");
      }
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Welcome!");
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md relative text-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 p-0 text-white"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-300 mt-2">
            {mode === "login"
              ? "Sign in to access your music library"
              : "Join Ripple to save your favorites"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-gray-200">
                Display Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 bg-gray-900 text-white"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 bg-gray-900 text-white"${emailError ? "border-red-600" : ""}`}
                required
              />
            </div>
            {emailError && (
              <p className="text-sm text-red-500 pt-1">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 bg-gray-900 text-white"${passwordError ? "border-red-600" : ""}`}
                required
                minLength={6}
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-500 pt-1">{passwordError}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-indigo-600 text-slate-100"
            disabled={loading || !!(emailError || passwordError)}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-sm text-gray-300">or</span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full text-white border-white/20"
        >
          <Chrome className="w-4 h-4 mr-2" />
          Continue with Google
        </Button>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={switchMode}
            className="text-sm text-slate-100 hover:text-gray-100 hover:underline"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
