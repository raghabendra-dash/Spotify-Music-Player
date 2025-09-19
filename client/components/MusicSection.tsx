import React, { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import LazyImage from "@/components/LazyImage";
import { useAudioPlayer } from "@/store/adapters/audioAdapter";
import {
  setQueue as setQueueAction,
  play as playAction,
  pause as pauseAction,
} from "@/store/audioPlayerSlice";
import { useAuth } from "@/store/adapters/authAdapter";
import { useTheme } from "@/store/adapters/themeAdapter";
import {
  addToFavorites,
  removeFromFavorites,
  isTrackFavorited,
  recordRecentlyPlayed,
} from "@/lib/firestore-service";
import { toast } from "sonner";
import type { Track } from "@shared/types";

interface MusicSectionProps {
  title: string;
  tracks: Track[];
  showMore?: boolean;
  onShowMore?: () => void;
  loading?: boolean;
  showHeader?: boolean;
}

function TrackCard({
  track,
  queue,
  index,
}: {
  track: Track;
  queue?: Track[];
  index?: number;
}) {
  const { state, dispatch } = useAudioPlayer();
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [isFavorited, setIsFavorited] = React.useState(false);
  const [favoriteLoading, setFavoriteLoading] = React.useState(false);

  const isCurrentTrack = state.currentTrack?.trackId === track.trackId;
  const isPlaying = isCurrentTrack && state.isPlaying;

  React.useEffect(() => {
    if (currentUser) {
      checkIfFavorited();
    }

    const handler = () => {
      // Re-check favorited state when favorites possibly changed elsewhere
      checkIfFavorited();
    };
    window.addEventListener("favorites-updated", handler as EventListener);
    return () =>
      window.removeEventListener("favorites-updated", handler as EventListener);
  }, [currentUser, track.trackId]);

  const checkIfFavorited = async () => {
    if (!currentUser) return;
    try {
      const favorited = await isTrackFavorited(currentUser.uid, track.trackId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error("Error checking if track is favorited:", error);
    }
  };

  const handlePlay = () => {
    if (isCurrentTrack) {
      dispatch(isPlaying ? pauseAction() : playAction());
    } else {
      // If a queue was provided (section), set full queue and the index, otherwise set single-track queue
      if (Array.isArray(queue) && typeof index === "number") {
        dispatch(setQueueAction({ tracks: queue, index }));
      } else {
        dispatch(setQueueAction({ tracks: [track], index: 0 }));
      }
      dispatch(playAction());

      // record recently played (best-effort) — use guest fallback if not signed in
      try {
        const uid = (currentUser && (currentUser as any).uid) || "guest_local";
        recordRecentlyPlayed(uid, track).catch(() => {});
      } catch (e) {
        // ignore
      }
    }
  };

  const handleFavorite = async () => {
    if (!currentUser) {
      toast.error("Please sign in to add favorites");
      return;
    }

    // Optimistic UI update
    const next = !isFavorited;
    setIsFavorited(next);

    setFavoriteLoading(true);
    try {
      if (next) {
        await addToFavorites(currentUser.uid, track);
        toast.success("Added to favorites");
      } else {
        await removeFromFavorites(currentUser.uid, track);
        toast.success("Removed from favorites");
      }
    } catch (error) {
      // Rollback on error
      setIsFavorited(!next);
      console.error("Failed to update favorites:", error);
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const isAnyPlaying = state.isPlaying;
  const cardBase = isAnyPlaying
    ? "group w-48 flex-shrink-0 transition-all duration-200 hover:-translate-y-1 relative z-0 hover:z-20"
    : "group w-48 flex-shrink-0 transition-all duration-200 relative z-0";

  const cardThemeClass =
    theme === "dark"
      ? `bg-[rgba(2,6,23,0.65)] border border-black/20 text-white ${isAnyPlaying ? "hover:shadow-[0_12px_48px_rgba(59,130,246,0.12)]" : ""}`
      : `bg-white border border-black/20 text-gray-900 ${isAnyPlaying ? "hover:shadow-lg" : ""}`;

  return (
    <Card className={`${cardBase} ${cardThemeClass}`}>
      <CardContent className="p-4">
        <div className="relative mb-3">
          <LazyImage
            src={track.artworkUrl100}
            alt={track.trackName}
            className="w-full aspect-square rounded-lg overflow-hidden border border-white/20"
            placeholder="cover"
          />

          {/* Heart top-right */}
          <button
            aria-label="Favorite"
            onClick={handleFavorite}
            className={`absolute top-3 right-3 rounded-full p-1 flex items-center justify-center ${theme === "dark" ? "bg-black/40 text-white hover:bg-black/60" : "bg-white/80 text-black hover:bg-white/95"}`}
          >
            {isFavorited ? (
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

          {/* Play overlay center (hover only) */}
          <button
            aria-label="Play preview"
            onClick={handlePlay}
            disabled={!track.previewUrl}
            className={`absolute inset-0 m-auto flex items-center justify-center size-12 rounded-full text-white 
    bg-gradient-to-r from-purple-600 to-cyan-600 
    shadow-lg hover:shadow-xl border border-white/20 backdrop-blur-md 
    transition-all duration-200 hover:scale-110 
    ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {/* Equalizer when playing */}
          {isPlaying && (
            <div className="absolute left-2 bottom-2 flex space-x-1 items-end h-6">
              <span className="w-[5px] h-3 eq-neon animate-eqb1 rounded-none"></span>
              <span className="w-[5px] h-5 eq-neon animate-eqb2 rounded-none"></span>
              <span className="w-[5px] h-6 eq-neon animate-eqb3 rounded-none"></span>
              <span className="w-[5px] h-5 eq-neon animate-eqb4 rounded-none"></span>
              <span className="w-[5px] h-3 eq-neon animate-eqb5 rounded-none"></span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3
            className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} text-sm truncate`}
          >
            {track.trackName}
          </h3>
          <p className="text-gray-400 text-xs truncate">{track.artistName}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MusicSection({
  title,
  tracks,
  showMore,
  onShowMore,
  loading = false,
  showHeader = true,
}: MusicSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [showLeftButton, setShowLeftButton] = React.useState(false);
  const [showRightButton, setShowRightButton] = React.useState(true);

  const updateButtonVisibility = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;

      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  React.useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      updateButtonVisibility();
      container.addEventListener("scroll", updateButtonVisibility);

      return () =>
        container.removeEventListener("scroll", updateButtonVisibility);
    }
  }, [tracks]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = Math.min(400, container.clientWidth * 0.8);

      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;

      let targetScroll = currentScroll;
      if (direction === "left") {
        targetScroll = Math.max(0, currentScroll - scrollAmount);
      } else {
        targetScroll = Math.min(maxScroll, currentScroll + scrollAmount);
      }

      container.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  };

  const renderSkeletons = (count = 7) =>
    Array.from({ length: count }).map((_, i) => (
      <Card
        key={`skeleton-${i}`}
        className="w-48 flex-shrink-0 bg-gray-800 animate-pulse"
      >
        <CardContent className="p-4">
          <div className="mb-3 bg-gray-700 rounded-lg h-40 w-full" />
          <div className="space-y-1">
            <div className="h-3 bg-gray-700 rounded w-3/4" />
            <div className="h-2 bg-gray-700 rounded w-1/2 mt-2" />
          </div>
        </CardContent>
      </Card>
    ));

  if (tracks.length === 0 && !loading) return null;

  return (
    <div className="mb-8">
      {showHeader !== false && (
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-2xl font-bold ${theme === "dark" ? "text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.9)]" : "text-gray-900"}`}
          >
            {title}
          </h2>
          {showMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowMore}
              className={
                theme === "dark"
                  ? "text-slate-300 hover:text-white"
                  : "text-gray-700 hover:text-black"
              }
            >
              Show all
            </Button>
          )}
        </div>
      )}

      <div className="relative">
        {showLeftButton && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 p-0 bg-black/70 hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </Button>
        )}

        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollBehavior: "smooth",
          }}
        >
          {tracks && tracks.length > 0
            ? tracks.map((track, idx) => (
                <TrackCard
                  key={track.trackId}
                  track={track}
                  queue={tracks}
                  index={idx}
                />
              ))
            : renderSkeletons(7)}
        </div>

        {showRightButton && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 p-0 bg-black/70 hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </Button>
        )}
      </div>
    </div>
  );
}
