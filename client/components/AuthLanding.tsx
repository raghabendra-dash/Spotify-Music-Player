import React from "react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/store/adapters/authAdapter";
import { toast } from "sonner";

export default function AuthLanding() {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const [showModal, setShowModal] = React.useState(false);
  const [mode, setMode] = React.useState<"login" | "signup">("login");

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
      // toast.success('Successfully logged in as Guest');
    } catch (err) {
      toast.error("Unable to continue as guest");
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Google login failed", err);
      // Provide clearer message for unauthorized-domain and offer guest fallback
      const isUnauthorized =
        err &&
        (err.code === "auth/unauthorized-domain" ||
          /unauthorized-domain/i.test(err.message || ""));
      if (isUnauthorized) {
        const proceed = window.confirm(
          "Google sign-in is blocked for this domain. Would you like to continue as a guest instead?",
        );
        if (proceed) {
          try {
            await loginAsGuest();
          } catch (guestErr) {
            console.error("Guest login failed", guestErr);
            alert("Unable to continue as guest. Please try again later.");
          }
        }
        return;
      }

      alert("Google login failed. Please check the console for details.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-violet-900 via-indigo-800 to-blue-700">
      <div className="max-w-md w-full bg-black/60 backdrop-blur-md rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center mb-3">
          <svg
            width="64"
            height="48"
            viewBox="0 0 64 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="ripple-logo mb-3"
            aria-hidden
          >
            <g
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M8 30v-6a14 14 0 0 1 14-14h4"
                className="logo-head-left"
              />
              <path
                d="M56 30v-6a14 14 0 0 0-14-14h-4"
                className="logo-head-right"
              />
              <rect
                x="6"
                y="26"
                width="8"
                height="12"
                rx="2"
                fill="#0f1724"
                className="logo-pad-left"
              />
              <rect
                x="50"
                y="26"
                width="8"
                height="12"
                rx="2"
                fill="#0f1724"
                className="logo-pad-right"
              />
            </g>
            <g
              transform="translate(16,24)"
              className="logo-waves"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path className="wave w1" d="M0 6 C3 3, 6 3, 9 6" />
              <path className="wave w2" d="M12 6 C15 2, 18 2, 21 6" />
              <path className="wave w3" d="M24 6 C27 4, 30 4, 33 6" />
            </g>
          </svg>

          <h1 className="text-3xl font-bold text-white">Ripple</h1>
        </div>
        <p className="text-gray-300 mb-6">
          Sign in to continue to your music experience
        </p>

        <div className="space-y-3">
          <Button
            className="w-full bg-blue-600 text-slate-100"
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>

          <Button
            className="w-full bg-white text-black"
            onClick={() => {
              setMode("signup");
              setShowModal(true);
            }}
          >
            Create Account
          </Button>

          <Button
            variant="ghost"
            className="w-full text-white/80 border border-white/10"
            onClick={() => {
              setMode("login");
              setShowModal(true);
            }}
          >
            Sign In
          </Button>

          <Button
            variant="ghost"
            className="w-full text-white/80 border border-white/10"
            onClick={handleGuestLogin}
          >
            Continue as Guest
          </Button>
        </div>
      </div>

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultMode={mode}
      />
    </div>
  );
}
