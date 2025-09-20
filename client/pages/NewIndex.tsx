import React, { useState, useEffect } from "react";
import {
  Search,
  Clock,
  TrendingUp,
  Play,
  Menu,
  Ticket,
  CheckCircle,
  Eraser,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import MusicSection from "@/components/MusicSection";
import AuthModal from "@/components/AuthModal";
import AuthLanding from "@/components/AuthLanding";
import Navbar from "@/components/Navbar";
import OfflineBanner from "@/components/OfflineBanner";
import LibrarySection from "@/components/LibrarySection";
import { useAuth } from "@/store/adapters/authAdapter";
import { useAudioPlayer } from "@/store/adapters/audioAdapter";
import LazyImage from "@/components/LazyImage";
import { searchMusic } from "@/lib/music-api";
import {
  getGenreMusic,
  getCategoryMusic,
  getRecommendations,
  genres,
} from "@/lib/genre-service";
import {
  getUserFavorites,
  getRecentlyPlayed,
  clearRecentlyPlayed,
} from "@/lib/firestore-service";
import ThemeToggle from "@/components/ThemeToggle";
import SettingsAudioQuality from "@/components/SettingsAudioQuality";
import SettingsStorage from "@/components/SettingsStorage";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useTheme } from "@/store/adapters/themeAdapter";
import type { Track } from "@shared/types";
import { Switch } from "@/components/ui/switch";
import LiveConcertSection from "@/components/LiveConcertSection";
import ConcertsPage from "@/pages/ConcertsPage";

function QuickAccessCard({
  title,
  subtitle,
  color,
  onClick,
}: {
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title} - ${subtitle}`}
      className={`relative p-4 rounded-lg bg-gradient-to-br ${color} cursor-pointer hover:scale-105 transition-transform duration-200 group overflow-hidden h-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-400`}
    >
      <div className="relative z-10 text-left">
        <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
        <p className="text-white/80 text-xs">{subtitle}</p>
      </div>
      <div
        className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"
        aria-hidden="true"
      />
    </button>
  );
}

function SearchPage() {
  const { theme } = useTheme();
  const inputClass =
    theme === "dark"
      ? "pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-white"
      : "pl-10 bg-white border-gray-200 text-black placeholder-gray-500 focus:border-black";
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = React.useRef<Map<string, Track[]>>(new Map());
  const lastProgrammaticRef = React.useRef<string | null>(null);

  const handleSearch = async (query: string) => {
    const q = (query || "").trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    if (
      lastProgrammaticRef.current &&
      lastProgrammaticRef.current === q &&
      cacheRef.current.has(q)
    ) {
      setSearchResults(cacheRef.current.get(q)!);
      return;
    }

    if (cacheRef.current.has(q)) {
      setSearchResults(cacheRef.current.get(q)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchMusic(q);
      const tracks = results?.results || [];
      cacheRef.current.set(q, tracks);
      setSearchResults(tracks);
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
      if (
        !lastProgrammaticRef.current ||
        lastProgrammaticRef.current !== searchQuery
      ) {
        handleSearch(searchQuery);
      }
      lastProgrammaticRef.current = null;
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // useEffect(() => {
  //   const handler = (e: Event) => {
  //     const detail = (e as CustomEvent)?.detail || {};
  //     const q = detail.query || detail.q || '';
  //     const genreId = detail.genreId || detail.categoryId || null;
  //     if (!q && !genreId) return;

  //     (async () => {
  //       setIsLoading(true);
  //       if (q) lastProgrammaticRef.current = q;
  //       setSearchQuery(q || '');
  //       try {
  //         if (genreId) {
  //           const results = await getGenreMusic(genreId, 50);
  //           setSearchResults(results || []);
  //           if ((!results || results.length === 0) && q) {
  //             const fallback = await searchMusic(q || '', 50);
  //             setSearchResults(fallback.results || []);
  //           }
  //         } else if (q) {
  //           const results = await searchMusic(q, 50);
  //           setSearchResults(results.results || []);
  //         }
  //       } catch (err) {
  //         console.error('perform-search handler failed:', err);
  //       } finally {
  //         setIsLoading(false);
  //         setTimeout(() => { lastProgrammaticRef.current = null; }, 800);
  //       }
  //     })();
  //   };

  //   window.addEventListener('perform-search', handler as EventListener);
  //   return () => window.removeEventListener('perform-search', handler as EventListener);
  // }, []);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1
          className={`text-3xl font-bold mb-6 ${theme === "dark" ? "text-white drop-shadow-[0_0_10px_rgba(15,23,36,0.7)]" : "text-gray-900"}`}
        >
          Search
        </h1>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="What do you want to listen to?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {!searchQuery && (
        <div>
          <h2
            className={
              theme === "dark"
                ? "text-xl font-bold mb-4 text-white"
                : "text-xl font-bold mb-4 text-gray-900"
            }
          >
            Browse all
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres.map((genre) => (
              <QuickAccessCard
                key={genre.id}
                title={genre.name}
                subtitle={genre.description}
                color={genre.color}
                onClick={async () => {
                  setIsLoading(true);
                  lastProgrammaticRef.current = genre.name;
                  setSearchQuery(genre.name);
                  try {
                    const results = await getGenreMusic(genre.id, 50);
                    setSearchResults(results);
                    // if (results.length === 0) {
                    //   const fallback = await searchMusic(genre.name, 50);
                    //   setSearchResults(fallback.results || []);
                    // }
                  } catch (err) {
                    console.error("Failed to load genre music:", err);
                    // const fallback = await searchMusic(genre.name, 50).catch(() => ({ results: [] } as any));
                    // setSearchResults(fallback.results || []);
                  } finally {
                    setIsLoading(false);
                    // setTimeout(() => { lastProgrammaticRef.current = null; }, 800);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="mt-4 text-gray-400">Searching for music...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <MusicSection
          title={`Results for "${searchQuery}"`}
          tracks={searchResults}
        />
      )}
    </div>
  );
}

function HomePage() {
  const { theme } = useTheme();
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [genreSections, setGenreSections] = useState<{
    [key: string]: Track[];
  }>({});
  const [countryTracks, setCountryTracks] = useState<Track[]>([]);
  const [hipHopTracks, setHipHopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const { state, dispatch } = useAudioPlayer();

  useEffect(() => {
    loadHomeContent();
  }, []);

  const loadHomeContent = async () => {
    setLoading(true);
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setTrendingTracks([]);
        setNewReleases([]);
        setRecommendations([]);
        setGenreSections({});
        setHipHopTracks([]);
        setCountryTracks([]);
        setInitialLoaded(true);
        return;
      }

      const [tInit, nInit, rInit, cInit, hInit] = await Promise.all([
        getCategoryMusic("trending", 12),
        getCategoryMusic("new-releases", 12),
        getRecommendations(12),
        getGenreMusic("country", 12),
        getGenreMusic("hip-hop", 12),
      ]);

      setTrendingTracks(tInit);
      setNewReleases(nInit);
      setRecommendations(rInit);
      setCountryTracks(cInit);
      setHipHopTracks(hInit);

      const genrePromises = genres.slice(0, 4).map(async (genre) => {
        const tracks = await getGenreMusic(genre.id, 12);
        return { id: genre.id, tracks };
      });

      const genreResults = await Promise.all(genrePromises);
      const genreData: { [key: string]: Track[] } = {};
      genreResults.forEach((g) => {
        genreData[g.id] = g.tracks;
      });
      setGenreSections(genreData);

      const takeUnique = (list: Track[], keep = 7) => {
        const out: Track[] = [];
        const seenLocal = new Set<string>();
        for (const t of list) {
          const artist = (t.artistName || "Unknown").toLowerCase();
          if (!seenLocal.has(artist)) {
            out.push(t);
            seenLocal.add(artist);
            if (out.length >= keep) break;
          }
        }
        return out;
      };

      const ensureMin = async (
        original: Track[],
        current: Track[],
        keep = 7,
        fallbackQuery?: string,
      ) => {
        const out = [...current];
        const seen = new Set<number>(out.map((t) => t.trackId));

        for (const t of original) {
          if (out.length >= keep) break;
          if (!seen.has(t.trackId)) {
            out.push(t);
            seen.add(t.trackId);
          }
        }

        if (out.length < keep && fallbackQuery) {
          try {
            const results = await searchMusic(fallbackQuery);
            const candidates = results.results || [];
            for (const t of candidates) {
              if (out.length >= keep) break;
              if (!seen.has(t.trackId)) {
                out.push(t);
                seen.add(t.trackId);
              }
            }
          } catch (err) {
            console.warn("Fallback fill failed for", fallbackQuery, err);
          }
        }

        return out;
      };

      let finalTrending = takeUnique(tInit, 7);
      let finalNew = takeUnique(nInit, 7);
      let finalRec = takeUnique(rInit, 7);
      let finalCountry = takeUnique(cInit, 7);
      let finalHipHop = takeUnique(hInit, 7);

      const finalGenres: { [key: string]: Track[] } = {};
      for (const g of genres.slice(0, 4)) {
        const list = genreData[g.id] || [];
        finalGenres[g.id] = takeUnique(list, 7);
      }

      finalTrending = await ensureMin(
        tInit,
        finalTrending,
        7,
        "top songs 2024",
      );
      finalNew = await ensureMin(nInit, finalNew, 7, "new music");
      finalRec = await ensureMin(rInit, finalRec, 7, "recommended songs");
      finalCountry = await ensureMin(cInit, finalCountry, 7, "country hits");
      finalHipHop = await ensureMin(hInit, finalHipHop, 7, "hip hop hits");

      for (const g of genres.slice(0, 4)) {
        const orig = genreData[g.id] || [];
        finalGenres[g.id] = await ensureMin(
          orig,
          finalGenres[g.id] || [],
          7,
          g.name,
        );
      }

      setTrendingTracks(finalTrending.slice(0, 12));
      setNewReleases(finalNew.slice(0, 12));
      setRecommendations(finalRec.slice(0, 12));
      setGenreSections(finalGenres);
      setCountryTracks(finalCountry.slice(0, 12));
      setHipHopTracks(finalHipHop.slice(0, 12));

      setInitialLoaded(true);
    } catch (error) {
      console.error("Error loading home content:", error);
    } finally {
      setLoading(false);
    }
  };

  const computeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const [greeting, setGreeting] = useState<string>(computeGreeting());
  React.useEffect(() => {
    const id = setInterval(() => setGreeting(computeGreeting()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1
          className={`text-3xl font-bold ${theme === "dark" ? "text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.9)]" : "text-gray-900"}`}
        >
          {greeting}
        </h1>
        <p
          className={
            theme === "dark"
              ? "text-lg font-roboto mt-2 text-white/80"
              : "text-lg font-roboto mt-2 text-gray-700"
          }
        >
          Explore the world of music — discover songs, playlists and more.
        </p>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {musicCategories.slice(0, 6).map((category) => (
          <QuickAccessCard
            key={category.id}
            title={category.name}
            subtitle="Your favorite tracks"
            color="from-purple-600 to-blue-600"
            onClick={() => window.dispatchEvent(new CustomEvent('perform-search', { detail: { categoryId: category.id, query: category.name } }))}
          />
        ))}
      </div> */}
      {/* 
      <div className="mb-8">
        <img src="https://plus.unsplash.com/premium_photo-1664303403877-7f079e34aec9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=1200&h=200&fit=crop" alt="Music" className="w-full h-auto rounded-lg" />
      </div> */}
      <LiveConcertSection />

      <MusicSection
        title="Trending Now"
        tracks={trendingTracks}
        showMore
        loading={!initialLoaded}
      />

      <MusicSection
        title="New Releases"
        tracks={newReleases}
        showMore
        loading={!initialLoaded}
      />

      <MusicSection
        title="Made for You"
        tracks={recommendations}
        showMore
        loading={!initialLoaded}
      />

      <MusicSection
        title="Country"
        tracks={countryTracks}
        showMore
        loading={!initialLoaded}
      />

      <MusicSection
        title="Hip-Hop"
        tracks={hipHopTracks}
        showMore
        loading={!initialLoaded}
      />

      {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {genres.slice(0, 8).map((genre) => (
          <QuickAccessCard
            key={genre.id}
            title={genre.name}
            subtitle={genre.description}
            color={genre.color}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('perform-search', {
                  detail: {
                    genreId: genre.id,
                    query: genre.name,
                  },
                })
              );
              window.dispatchEvent(
                new CustomEvent('navigate', {
                  detail: { page: 'search' },
                })
              );
            }}
          />
        ))}
      </div> */}

      {genres.slice(0, 4).map((genre) => {
        if (genre.id === "indieosng" || genre.id === "bollywood") return null;
        const tracks = genreSections[genre.id] || [];

        if (genre.id === "pop") {
          const bollyTracks = genreSections["bollywood"] || [];
          return (
            <React.Fragment key={genre.id}>
              <MusicSection
                key={`bollywood-section`}
                title={`Bollywood Vibes`}
                tracks={bollyTracks}
                showMore
                loading={!initialLoaded}
              />
              <MusicSection
                key={genre.id}
                title={`${genre.name} Hits`}
                tracks={tracks}
                showMore
                loading={!initialLoaded}
              />
            </React.Fragment>
          );
        }

        if (genre.id === "rock") {
          const indianTracks = genreSections["indieosng"] || [];
          return (
            <React.Fragment key={genre.id}>
              <MusicSection
                key={`indieosng-section`}
                title={`South Indian Hits`}
                tracks={indianTracks}
                showMore
                loading={!initialLoaded}
              />
              <MusicSection
                key={genre.id}
                title={`${genre.name} Hits`}
                tracks={tracks}
                showMore
                loading={!initialLoaded}
              />
            </React.Fragment>
          );
        }

        return (
          <MusicSection
            key={genre.id}
            title={`${genre.name} Hits`}
            tracks={tracks}
            showMore
            loading={!initialLoaded}
          />
        );
      })}
    </div>
  );
}

function SettingsPage() {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [playFullTrack, setPlayFullTrack] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem("playFullTrack");
    setPlayFullTrack(storedValue === "1");
  }, []);

  const handlePlayFullTrackChange = (checked: boolean) => {
    setPlayFullTrack(checked);
    try {
      if (checked) {
        localStorage.setItem("playFullTrack", "1");
      } else {
        localStorage.removeItem("playFullTrack");
      }
      window.dispatchEvent(
        new CustomEvent("play-full-updated", { detail: { enabled: checked } }),
      );
    } catch (err) {
      console.warn("Failed to save playFullTrack setting", err);
    }
  };

  return (
    <div className="py-8 px-4 max-w-3xl mx-auto bg-transparent">
      <h2
        className={
          theme === "dark"
            ? "text-2xl font-bold mb-4 text-white"
            : "text-2xl font-bold mb-4 text-gray-900"
        }
      >
        Account Settings
      </h2>
      <div className="bg-gray-900 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-300">Account</div>
            <div className="text-white font-medium">
              {currentUser?.displayName || "Guest"}
            </div>
            <div className="text-xs text-gray-400">
              {(currentUser as any)?.email || "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-300">Theme</div>
            <div className="text-xs text-gray-400">
              Toggle light / dark theme
            </div>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-300">Play full track</div>
            <div className="text-xs text-gray-400">
              When enabled, the player will use a track's full URL if available;
              otherwise falls back to preview.
            </div>
          </div>
          <div>
            <Switch
              checked={playFullTrack}
              onCheckedChange={handlePlayFullTrackChange}
              className="group"
            />
          </div>
        </div>

        <SettingsAudioQuality />
        <SettingsStorage />
      </div>
    </div>
  );
}

export default function Index() {
  const [currentPage, setCurrentPage] = useState("home");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { currentUser } = useAuth();
  const [favoritesTracks, setFavoritesTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const { theme } = useTheme();
  const defaultDarkBg = "bg-[#112B5C] text-white";
  const homeDarkBg = "bg-[#112B5C]  text-white";
  const pageBgClass =
    theme === "light"
      ? "bg-white text-black"
      : currentPage === "home"
        ? homeDarkBg
        : defaultDarkBg;

  const handleShowAuthModal = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  useEffect(() => {
    let mounted = true;
    const loadLists = async () => {
      const uid = (currentUser && (currentUser as any).uid) || "guest_local";
      try {
        const [fav, recent] = await Promise.all([
          getUserFavorites(uid),
          getRecentlyPlayed(uid),
        ]);
        if (mounted) {
          setFavoritesTracks(fav || []);
          setRecentTracks(recent || []);
        }
      } catch (err) {
        console.error("Failed to load favorites/recent:", err);
        if (mounted) {
          setFavoritesTracks([]);
          setRecentTracks([]);
        }
      }
    };

    loadLists();

    const favHandler = () => {
      loadLists();
    };
    const recentHandler = () => {
      loadLists();
    };
    const plsHandler = () => {
      loadLists();
    };
    window.addEventListener("favorites-updated", favHandler as EventListener);
    window.addEventListener("recent-updated", recentHandler as EventListener);
    window.addEventListener("playlists-updated", plsHandler as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener(
        "favorites-updated",
        favHandler as EventListener,
      );
      window.removeEventListener(
        "recent-updated",
        recentHandler as EventListener,
      );
      window.removeEventListener(
        "playlists-updated",
        plsHandler as EventListener,
      );
    };
  }, [currentUser]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || { mode: "login" };
      setAuthMode(detail.mode || "login");
      setShowAuthModal(true);
    };
    window.addEventListener("open-auth-modal", handler as EventListener);

    const navHandler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || { page: "home" };
      setCurrentPage(detail.page || "home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("navigate", navHandler as EventListener);

    return () => {
      window.removeEventListener("open-auth-modal", handler as EventListener);
      window.removeEventListener("navigate", navHandler as EventListener);
    };
  }, []);

  const renderContent = () => {
    switch (currentPage) {
      case "search":
        return <SearchPage />;
      case "library":
        return <LibrarySection />;
      case "favorites":
        return (
          <div className="py-8 px-4 max-w-6xl mx-auto">
            <h2
              className={
                theme === "dark"
                  ? "text-2xl font-bold mb-4 text-white"
                  : "text-2xl font-bold mb-4 text-gray-900"
              }
            >
              Liked Songs
            </h2>
            {favoritesTracks.length === 0 ? (
              <p className="text-gray-400">
                No liked songs yet. Tap the heart icon on any track to add it
                here.
              </p>
            ) : (
              <MusicSection
                title="Liked Songs"
                tracks={favoritesTracks}
                showHeader={false}
              />
            )}
          </div>
        );
      case "recent":
        return (
          <div className="py-8 px-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2
                className={
                  theme === "dark"
                    ? "text-2xl font-bold text-white"
                    : "text-2xl font-bold text-gray-900"
                }
              >
                Recently Played
              </h2>
              {recentTracks.length > 0 && (
                <button
                  onClick={async () => {
                    if (!currentUser) return toast.error("Please sign in");
                    try {
                      await clearRecentlyPlayed((currentUser as any).uid);
                      setRecentTracks([]);
                      toast.success("Cleared recently played");
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to clear recently played");
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                >
                  <Eraser className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            {recentTracks.length === 0 ? (
              <p className="text-gray-400">
                Your recently played tracks will appear here after you play
                songs.
              </p>
            ) : (
              <MusicSection
                title="Recently Played"
                tracks={recentTracks}
                showHeader={false}
              />
            )}
          </div>
        );
      case "settings":
        return <SettingsPage />;
      case "concerts":
        return <ConcertsPage />;
      default:
        return <HomePage />;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <AuthLanding />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBgClass}`}>
      <div className="flex">
        <div className="hidden md:block fixed left-0 top-0 h-full">
          <Sidebar
            currentPage={currentPage}
            onPageChange={(p) => {
              setCurrentPage(p);
              setMobileSidebarOpen(false);
            }}
            onShowAuthModal={(m) => {
              handleShowAuthModal(m);
              setMobileSidebarOpen(false);
            }}
          />
        </div>

        <div className="md:hidden fixed top-4 left-4 z-50">
          <button
            aria-label="Open menu"
            className={`${theme === "dark" ? "p-2 rounded-md bg-black/60 text-white neon-ring neon-focus" : "p-2 rounded-md bg-white/90 text-black neon-ring-light neon-focus"}`}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-64 h-full">
              <Sidebar
                currentPage={currentPage}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  setMobileSidebarOpen(false);
                }}
                onShowAuthModal={(m) => {
                  handleShowAuthModal(m);
                  setMobileSidebarOpen(false);
                }}
                isOpen={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex-1 md:ml-64 overflow-hidden">
          <div className="min-h-screen">
            <div className="pt-20 px-6 md:px-8 pb-32 max-w-full">
              <OfflineBanner />
              <Navbar
                onSearch={(q) =>
                  window.dispatchEvent(
                    new CustomEvent("perform-search", { detail: { q } }),
                  )
                }
                onNavLeft={() => setCurrentPage("home")}
                onNavRight={() => setCurrentPage("search")}
              />
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
