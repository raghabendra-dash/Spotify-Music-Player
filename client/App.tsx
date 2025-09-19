import "./global.css";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from "react-router-dom";
import { Provider as ReduxProvider, useDispatch } from "react-redux";
import store from "./store";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/NewIndex";
import ConcertsPage from "./pages/ConcertsPage";
import NotFound from "./pages/NotFound";
import AudioPlayer from "./components/AudioPlayer";
import {
  setUser as setUserAction,
  setLoading as setLoadingAction,
} from "./store/authSlice";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import {
  setCurrentTime as setCurrentTimeAction,
  setDuration as setDurationAction,
  next as nextAction,
} from "./store/audioPlayerSlice";
import AuthLanding from "./components/AuthLanding";

const queryClient = new QueryClient();

const AuthAndAudioInitializer = () => {
  const dispatch = useDispatch();
  const [initialized, setInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize auth listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    (async () => {
      try {
        const mod = await import("./lib/firebase");
        const hasValidConfig = mod.hasValidConfig;
        if (!hasValidConfig) {
          if (mounted) {
            // 👇 fallback to guest if config is invalid
            setCurrentUser(null);
            dispatch(setUserAction({ isGuest: true }));
            dispatch(setLoadingAction(false));
            setInitialized(true);
          }
          return;
        }

        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!mounted) return;

          if (user) {
            // 👇 logged-in user
            setCurrentUser(user);
            const serial = {
              uid: user.uid,
              displayName: user.displayName || null,
              email: user.email || null,
              isGuest: false,
            };
            dispatch(setUserAction(serial));
          } else {
            // 👇 no user → stay on AuthLanding, not silent guest
            setCurrentUser(null);
            dispatch(setUserAction(null));
          }

          dispatch(setLoadingAction(false));
          setInitialized(true);
        });
      } catch (err) {
        console.warn(
          "Failed to initialize auth listener, falling back to guest:",
          err,
        );
        if (mounted) {
          // 👇 explicit guest on error
          setCurrentUser(null);
          dispatch(setUserAction({ isGuest: true }));
          dispatch(setLoadingAction(false));
          setInitialized(true);
        }
      }
    })();

    return () => {
      mounted = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [dispatch]);

  // Audio element initializer + sync handlers
  useEffect(() => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.style.display = "none";
    document.body.appendChild(audio);

    const handleTimeUpdate = () =>
      dispatch(setCurrentTimeAction(audio.currentTime));
    const handleDurationChange = () =>
      dispatch(setDurationAction(audio.duration));
    const handleEnded = () => dispatch(nextAction());

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      try {
        document.body.removeChild(audio);
      } catch (e) {}
    };
  }, [dispatch]);

  // wait until auth is initialized
  if (!initialized) return null;

  // no user → show AuthLanding
  if (!currentUser) return <AuthLanding />;

  // user exists → nothing to render here
  return null;
};

const AppLayout = () => {
  const location = useLocation();
  const showAudioPlayer = location.pathname !== "/concerts";

  return (
    <>
      <Outlet />
      {showAudioPlayer && <AudioPlayer />}
    </>
  );
};

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Index /> },
      { path: "/concerts", element: <ConcertsPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const App = () => {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      try {
        const filename = (e && (e as any).filename) || "";
        const message = e && e.message ? e.message : "";
        // If it's a network fetch failure coming from FullStory or our music API, suppress it to avoid noisy logs in preview
        if (
          message.includes("Failed to fetch") &&
          (filename.includes("fullstory") ||
            filename.includes("edge.fullstory.com") ||
            message.includes("fullstory") ||
            message.includes("/api/music") ||
            filename.includes("/api/music"))
        ) {
          e.preventDefault();
          console.debug(
            "Suppressed third-party or local fetch error:",
            filename || message,
          );
        }
      } catch (err) {}
    };

    const onRejection = (ev: PromiseRejectionEvent) => {
      try {
        const reason = ev && (ev.reason || "");
        const msg =
          typeof reason === "string"
            ? reason
            : (reason && reason.message) || "";
        const stack = reason && reason.stack ? String(reason.stack) : "";
        // Suppress FullStory and local music API fetch noise
        if (
          String(msg).includes("Failed to fetch") &&
          (String(msg).includes("fullstory") ||
            String(stack).includes("fullstory") ||
            String(msg).includes("/api/music") ||
            String(stack).includes("/api/music") ||
            (ev &&
              (ev as any).message &&
              String((ev as any).message).includes("fullstory")))
        ) {
          ev.preventDefault();
          console.debug(
            "Suppressed third-party or local unhandled rejection: Failed to fetch",
          );
          return;
        }
      } catch (err) {}
    };

    window.addEventListener("error", onError as EventListener);
    window.addEventListener("unhandledrejection", onRejection as EventListener);
    return () => {
      window.removeEventListener("error", onError as EventListener);
      window.removeEventListener(
        "unhandledrejection",
        onRejection as EventListener,
      );
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ReduxProvider store={store}>
            <Toaster />
            <Sonner />
            <AuthAndAudioInitializer />
            <RouterProvider router={router} />
          </ReduxProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
