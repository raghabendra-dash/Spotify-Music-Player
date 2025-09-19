import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Heart,
  VolumeX,
} from "lucide-react";
import { useAudioPlayer } from "@/store/adapters/audioAdapter";
import { useTheme } from "@/store/adapters/themeAdapter";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/store/adapters/authAdapter";
import {
  addToFavorites,
  removeFromFavorites,
  isTrackFavorited,
  getUserFavorites,
} from "@/lib/firestore-service";
import {
  setCurrentTime as setCurrentTimeAction,
  setVolume as setVolumeAction,
  play as playAction,
  pause as pauseAction,
  next as nextAction,
  previous as previousAction,
  toggleShuffle as toggleShuffleAction,
  setDuration as setDurationAction,
} from "@/store/audioPlayerSlice";

export default function AudioPlayer() {
  const { state, dispatch } = useAudioPlayer();
  const { theme } = useTheme();
  const location = useLocation();
  const { currentUser } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const hideOn = ["/auth", "/signin", "/signup", "/guest", "/landing"];
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [localVolume, setLocalVolume] = useState<number>(state.volume ?? 1);
  const [isFavoritedState, setIsFavoritedState] = useState(false);
  const volumeRef = useRef<HTMLDivElement | null>(null);
  const [previousVolume, setPreviousVolume] = useState<number>(
    state.volume ?? 1,
  );

  const { currentTrack, isPlaying, currentTime, duration, shuffle, volume } =
    state;

  // Sync Redux state to <audio> element
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current
        .play()
        .catch((e) => console.error("Error playing audio:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setLocalVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.previewUrl;
      if (isPlaying) {
        audioRef.current
          .play()
          .catch((e) => console.error("Error playing audio:", e));
      }
    }
  }, [currentTrack]);

  // Sync <audio> element to Redux state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
    };
  }, [dispatch, currentTrack]);

  // update favorite flag when track/user changes
  useEffect(() => {
    let mounted = true;
    if (!currentTrack) {
      setIsFavoritedState(false);
      return () => {
        mounted = false;
      };
    }
    (async () => {
      try {
        const uid = (currentUser && (currentUser as any).uid) || `guest_local`;
        const fav = await isTrackFavorited(uid, currentTrack.trackId);
        if (mounted) setIsFavoritedState(!!fav);
      } catch (e) {}
    })();
    return () => {
      mounted = false;
    };
  }, [currentTrack, currentUser]);

  // close popups on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showVolumePopup) return;
      const el = volumeRef.current;
      if (!el) return;
      if (!(e.target instanceof Node)) return;
      if (!el.contains(e.target)) setShowVolumePopup(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showVolumePopup]);

  // toggle play/pause
  const togglePlay = () => dispatch(isPlaying ? pauseAction() : playAction());
  const prev = () => dispatch(previousAction());
  const next = () => dispatch(nextAction());

  // seek handler
  const onSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && audioRef.current) {
      audioRef.current.currentTime = v;
      dispatch(setCurrentTimeAction(v));
    }
  };

  // volume handler
  const handleVolumeChange = (val: number) => {
    const v = Math.max(0, Math.min(1, val));
    setLocalVolume(v);
    dispatch(setVolumeAction(v));
  };

  // toggle mute
  const toggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      handleVolumeChange(0);
    } else {
      handleVolumeChange(previousVolume > 0 ? previousVolume : 1);
    }
  };

  // favorite toggle
  const toggleFavorite = async () => {
    if (!currentTrack) return;
    const uid = (currentUser && (currentUser as any).uid) || `guest_local`;
    try {
      if (isFavoritedState) {
        await removeFromFavorites(uid, currentTrack);
        setIsFavoritedState(false);
      } else {
        await addToFavorites(uid, currentTrack);
        setIsFavoritedState(true);
      }
      window.dispatchEvent(new CustomEvent("favorites-updated"));
    } catch (e) {
      console.error("Failed to toggle favorite", e);
    }
  };

  // keep Player in sync with favorites
  useEffect(() => {
    const updateFavoriteStatus = async () => {
      if (!currentTrack) return;
      const uid = (currentUser && (currentUser as any).uid) || "guest_local";

      const favs = await getUserFavorites(uid); // from your helper
      const isFav = favs.some((song) => song.trackId === currentTrack.trackId);
      setIsFavoritedState(isFav);
    };

    window.addEventListener("favorites-updated", updateFavoriteStatus);
    updateFavoriteStatus();

    return () => {
      window.removeEventListener("favorites-updated", updateFavoriteStatus);
    };
  }, [currentTrack, currentUser]);

  // avoid rendering on auth pages or when no user
  const shouldHide =
    !currentUser || hideOn.some((p) => location.pathname.startsWith(p));
  if (shouldHide) return null;

  if (!currentTrack) {
    return (
      <div
        className={`fixed bottom-0 left-64 right-0 z-50 ${theme === "dark" ? "bg-black/60" : "bg-white/95"} backdrop-blur-sm border-t ${theme === "dark" ? "border-white/6" : "border-gray-200"} shadow-md`}
      >
        <div className="flex items-center justify-center gap-3 px-3 py-2 h-16">
          <div
            className={`text-sm font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
          >
            Select a song to play
          </div>
        </div>
      </div>
    );
  }

  const format = (t: number) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const truncate = (name: string | undefined) => {
    if (!name) return "";
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

  return (
    <>
      <audio ref={audioRef} />
      <div
        className={`fixed bottom-0 left-64 right-0 z-50 ${theme === "dark" ? "bg-black/60" : "bg-white/95"} backdrop-blur-sm border-t ${theme === "dark" ? "border-white/5" : "border-gray-200"} shadow-md`}
      >
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Left: artwork + info */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={currentTrack?.artworkUrl60 || "/placeholder.svg"}
              alt={currentTrack?.trackName || "No track"}
              className="w-10 h-10 rounded-sm object-cover"
            />
            {currentTrack && isPlaying && (
              <div className="player-wave playing" aria-hidden>
                <span className="s1" />
                <span className="s2" />
                <span className="s3" />
                <span className="s4" />
                <span className="s5" />
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div
                className={`text-md font-semibold truncate ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                {truncate(currentTrack?.trackName)}
              </div>
              <div
                className={`text-sm truncate ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
              >
                {truncate(currentTrack?.artistName)}
              </div>
            </div>
          </div>

          {/* Center: controls + seek bar */}
          <div className="flex-1 flex flex-col gap-1 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <button
                aria-label="Previous"
                onClick={prev}
                disabled={!currentTrack}
                className={`p-1 rounded ${currentTrack ? (theme === "dark" ? "text-white" : "text-black") : "text-gray-400"} ${theme === "dark" ? "hover:bg-black/5" : "hover:bg-white/5"}`}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                aria-label="Play/Pause"
                onClick={togglePlay}
                disabled={!currentTrack}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${currentTrack ? "bg-gradient-to-r from-purple-600 to-blue-600" : "bg-gray-200"} shadow`}
              >
                {isPlaying ? (
                  <Pause
                    className={`w-4 h-4 ${currentTrack ? "text-white" : "text-gray-500"}`}
                  />
                ) : (
                  <Play
                    className={`w-4 h-4 ${currentTrack ? "text-white" : "text-gray-500"}`}
                  />
                )}
              </button>

              <button
                aria-label="Next"
                onClick={next}
                disabled={!currentTrack}
                className={`p-1 rounded ${currentTrack ? (theme === "dark" ? "text-white" : "text-black") : "text-gray-400"} ${theme === "dark" ? "hover:bg-black/5" : "hover:bg-white/5"}`}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"} w-12 text-right`}
              >
                {format(currentTime)}
              </div>

              <input
                aria-label="Seek"
                type="range"
                min={0}
                max={Math.max(0, Math.floor(duration || 0))}
                step={0.01}
                value={Math.min(currentTime, duration || 0)}
                onChange={onSeekChange}
                className="player-slider h-1 flex-1 rounded-full"
                style={{
                  backgroundImage: `linear-gradient(90deg, rgba(139,92,246,0.95), rgba(124,58,237,0.9) 35%, rgba(59,130,246,0.9) 100%)`,
                  backgroundColor: theme === "dark" ? "#ffffff" : "#000000",
                  backgroundSize: `${duration && duration > 0 ? Math.round((currentTime / duration) * 100) : 0}% 100%`,
                  backgroundRepeat: "no-repeat",
                }}
              />

              <div
                className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"} w-12 text-left`}
              >
                {format(duration)}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 pr-4">
            <button
              aria-label="Favorite"
              onClick={toggleFavorite}
              className={`p-1 rounded ${isFavoritedState ? "" : theme === "dark" ? "text-white/70" : "text-black"}`}
            >
              {isFavoritedState ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-red-500"
                  fill="currentColor"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className={`w-4 h-4 ${theme === "dark" ? "text-white" : "text-black"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              )}
            </button>

            {/* Volume slider popup opener (separate button) */}
            <div ref={volumeRef} className="relative">
              <button
                aria-label="Open volume slider"
                onClick={() => setShowVolumePopup((s) => !s)}
                className={`p-2 rounded ${localVolume === 0 ? "text-red-500" : currentTrack ? (theme === "dark" ? "text-white" : "text-black") : "text-gray-600"}`}
              >
                {localVolume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              {showVolumePopup && (
                <div
                  className={`absolute left-1/2 transform -translate-x-1/2 bottom-full mb-3 p-2 ${theme === "dark" ? "bg-black/80 text-white" : "bg-white/95 text-black"} rounded-md shadow-lg flex flex-col items-center`}
                  style={{ minWidth: 56 }}
                >
                  <div className="flex items-center justify-center h-32">
                    <input
                      aria-label="Volume"
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={localVolume}
                      onChange={(e) =>
                        handleVolumeChange(parseFloat(e.target.value))
                      }
                      className="volume-range-vertical"
                      style={{
                        width: 120,
                        height: 6,
                        backgroundImage:
                          "linear-gradient(90deg,#8b5cf6,#3b82f6)",
                        backgroundSize: `${Math.round(localVolume * 100)}% 100%`,
                        backgroundRepeat: "no-repeat",
                        backgroundColor:
                          theme === "dark" ? "#ffffff" : "#000000",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              aria-label="Shuffle"
              onClick={() => dispatch(toggleShuffleAction())}
              className={`p-2 rounded transition-colors ${shuffle ? "text-purple-500" : currentTrack ? (theme === "dark" ? "text-white" : "text-black") : "text-gray-600"}`}
              title={shuffle ? "Shuffle (on)" : "Shuffle (off)"}
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
