import React, { useState, useEffect } from "react";
import { Search, Play, Pause, Plus, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioPlayer } from "@/store/adapters/audioAdapter";
import { useAuth } from "@/store/adapters/authAdapter";
import {
  setQueue as setQueueAction,
  play as playAction,
  pause as pauseAction,
} from "@/store/audioPlayerSlice";
import { searchMusic } from "@/lib/music-api";
import {
  addToFavorites,
  removeFromFavorites,
  isTrackFavorited,
  recordRecentlyPlayed,
} from "@/lib/firestore-service";
import AuthModal from "@/components/AuthModal";
import { toast } from "sonner";
import type { Track } from "@shared/types";
import AnimatedLogo from "@/components/AnimatedLogo";

function TrackCard({ track }: { track: Track }) {
  const { state, dispatch } = useAudioPlayer();
  const { currentUser } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const isCurrentTrack = state.currentTrack?.trackId === track.trackId;
  const isPlaying = isCurrentTrack && state.isPlaying;

  useEffect(() => {
    if (currentUser) {
      checkIfFavorited();
    }
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
      // set single track queue
      dispatch(setQueueAction({ tracks: [track], index: 0 }));
      dispatch(playAction());
      try {
        if (currentUser)
          recordRecentlyPlayed(currentUser.uid, track).catch(() => {});
      } catch (e) {}
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
      setIsFavorited(!next);
      console.error("Failed to update favorites:", error);
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={track.artworkUrl100}
              alt={`${track.trackName} artwork`}
              className="w-16 h-16 rounded-lg object-cover"
            />

            <button
              aria-label="Favorite"
              onClick={handleFavorite}
              className={`absolute top-1 right-1 bg-black/40 rounded-full p-1 text-white hover:bg-black/60 flex items-center justify-center`}
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
                  className="w-4 h-4 text-white"
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

            <Button
              size="sm"
              className="absolute inset-0 m-auto w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/50 text-white"
              onClick={handlePlay}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {track.trackName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {track.artistName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {track.collectionName}
            </p>
            {track.trackTimeMillis && (
              <p className="text-xs text-muted-foreground">
                {formatDuration(track.trackTimeMillis)}
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const { currentUser, logout } = useAuth();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchMusic(query);
      setSearchResults(results.results);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to search music. Please try again.";
      setError(errorMessage);
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Load some popular tracks on initial load
  useEffect(() => {
    const loadInitialTracks = async () => {
      try {
        await handleSearch("top songs 2024");
      } catch (error) {
        // If initial search fails, try with a simpler query
        try {
          await handleSearch("music");
        } catch (secondError) {
          console.error("Failed to load initial tracks:", secondError);
          // Set a user-friendly message for initial load failures
          setError(
            "Unable to load music. Please check your internet connection and try searching.",
          );
        }
      }
    };

    loadInitialTracks();
  }, []);

  const handleSignIn = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <AnimatedLogo size={36} />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={handleSignIn}>
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                    onClick={handleSignUp}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Discover Your Next Favorite Song
          </h2>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for songs, artists, or albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Searching for music...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!isLoading &&
            !error &&
            searchResults.length === 0 &&
            searchQuery && (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No results found for "{searchQuery}"
                </p>
              </div>
            )}

          {!isLoading && searchResults.length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : "Popular Tracks"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((track) => (
                  <TrackCard key={track.trackId} track={track} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
