import React, { useEffect, useState } from "react";
import { useAuth } from "@/store/adapters/authAdapter";
import { useTheme } from "@/store/adapters/themeAdapter";
import {
  createPlaylist,
  getUserPlaylists,
  addTrackToPlaylist,
  deletePlaylist,
} from "@/lib/firestore-service";
import { genres, getGenreMusic } from "@/lib/genre-service";
import { useAudioPlayer } from "@/store/adapters/audioAdapter";
import {
  setQueue as setQueueAction,
  play as playAction,
} from "@/store/audioPlayerSlice";
import { Button } from "@/components/ui/button";
import LazyImage from "@/components/LazyImage";
import type { Track, Playlist } from "@shared/types";
import { toast } from "sonner";

export default function LibrarySection() {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { dispatch } = useAudioPlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreTracks, setGenreTracks] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Record<number, boolean>>(
    {},
  );
  const [creating, setCreating] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  useEffect(() => {
    if (currentUser) loadPlaylists();

    const handler = () => {
      if (currentUser) loadPlaylists();
    };
    window.addEventListener("playlists-updated", handler as EventListener);
    return () =>
      window.removeEventListener("playlists-updated", handler as EventListener);
  }, [currentUser]);

  const loadPlaylists = async () => {
    if (!currentUser) return;
    try {
      const pls = await getUserPlaylists(currentUser.uid);
      setPlaylists(pls);
    } catch (err) {
      console.error(err);
    }
  };

  const selectGenre = async (genreId: string) => {
    setSelectedGenre(genreId);
    setGenreTracks([]);
    try {
      const tracks = await getGenreMusic(genreId, 30);
      setGenreTracks(tracks);
      setSelectedTracks({});
    } catch (err) {
      console.error("Failed to load genre tracks", err);
    }
  };

  const toggleTrack = (track: Track) => {
    setSelectedTracks((s) => ({ ...s, [track.trackId]: !s[track.trackId] }));
  };

  const handleCreatePlaylist = async () => {
    if (!currentUser) return toast.error("Please sign in");
    const tracksToAdd = genreTracks.filter((t) => selectedTracks[t.trackId]);
    if (!playlistName.trim())
      return toast.error("Please enter a playlist name");
    if (tracksToAdd.length === 0)
      return toast.error("Select at least one track");

    setCreating(true);
    try {
      const playlistId = await createPlaylist(
        currentUser.uid,
        playlistName.trim(),
        `From ${selectedGenre}`,
      );
      await Promise.all(
        tracksToAdd.map((t) => addTrackToPlaylist(playlistId, t)),
      );
      toast.success("Playlist created");
      setPlaylistName("");
      setSelectedGenre(null);
      setGenreTracks([]);
      await loadPlaylists();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create playlist");
    } finally {
      setCreating(false);
    }
  };

  const playPlaylist = (pl: Playlist) => {
    const tracks = (pl.tracks || []).map(
      (p) => (p.trackData || p) as Track,
    ) as Track[];
    if (tracks.length === 0) return toast.error("Playlist is empty");
    dispatch(setQueueAction({ tracks, index: 0 }));
    dispatch(playAction());
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await deletePlaylist(playlistId, currentUser.uid);
      toast.success("Playlist deleted");
      await loadPlaylists();
    } catch (error) {
      console.error("Failed to delete playlist", error);
      toast.error("Failed to delete playlist");
    }
  };

  const panelBase =
    theme === "dark"
      ? "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)] text-white"
      : "bg-white/90 border border-gray-200 text-black";
  const accent =
    theme === "dark"
      ? "from-[#0ea5ff] to-[#60a5fa]"
      : "from-[#bfdbfe] to-[#dbeafe]";

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-12">
      <h2
        className={
          theme === "dark"
            ? "text-3xl font-bold text-white"
            : "text-3xl font-bold text-gray-900"
        }
      >
        Your Library
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left column - controls and playlists */}
        <aside className="md:col-span-1 space-y-4">
          <div className={`${panelBase} rounded-xl p-4 flex flex-col gap-3`}>
            <div
              className={`p-2 rounded-md bg-violet-500 text-white shadow-md`}
            >
              <h3 className="text-sm font-semibold">Create Playlist</h3>
              <p className="text-xs">Select tracks and create a playlist</p>
            </div>

            <div>
              <label
                className={`text-sm ${theme === "dark" ? "text-white/80" : "text-gray-700"}`}
              >
                Playlist name
              </label>
              <input
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                className={`mt-2 w-full rounded-md px-3 py-2 ${theme === "dark" ? "bg-[rgba(255,255,255,0.02)] text-white border border-[rgba(255,255,255,0.04)]" : "bg-white text-black border border-gray-200"}`}
                placeholder="My new playlist"
              />
            </div>

            <div>
              <label
                className={`block text-sm ${theme === "dark" ? "text-white/80" : "text-gray-700"} mt-3`}
              >
                Select genre
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {genres.slice(0, 8).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => selectGenre(g.id)}
                    className={`text-left p-2 rounded-md transition ${selectedGenre === g.id ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white" : theme === "dark" ? "bg-[rgba(255,255,255,0.02)] text-white/90" : "bg-gray-100 text-gray-900"}`}
                  >
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs mt-1 text-gray-400">
                      {g.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreatePlaylist}
              className="mt-4 w-full bg-violet-500"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Playlist"}
            </Button>

            <div className="pt-2">
              <h4
                className={`text-sm font-medium ${theme === "dark" ? "text-white/90" : "text-gray-700"}`}
              >
                Your Playlists
              </h4>
              <div className="mt-3 space-y-2">
                {playlists.length === 0 && (
                  <p
                    className={
                      theme === "dark" ? "text-white/60" : "text-gray-500"
                    }
                  >
                    No playlists yet
                  </p>
                )}
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className={`${theme === "dark" ? "bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)]" : "bg-white border border-gray-100"} rounded-md p-2 flex items-center justify-between cursor-pointer`}
                    onClick={() => handleDeletePlaylist(pl.id)}
                  >
                    <div>
                      <div
                        className={
                          theme === "dark"
                            ? "text-white text-sm font-medium"
                            : "text-gray-900 text-sm font-medium"
                        }
                      >
                        {pl.name}
                      </div>
                      <div
                        className={
                          theme === "dark"
                            ? "text-white/60 text-xs"
                            : "text-gray-500 text-xs"
                        }
                      >
                        {(pl.tracks || []).length} tracks
                      </div>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPlaylist(pl);
                        }}
                        className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white"
                      >
                        Play
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right column - tracks and grid */}
        <section className="md:col-span-3">
          <div className={`${panelBase} rounded-xl p-4 min-h-[420px]`}>
            <div className="flex items-center justify-between mb-4">
              <h3
                className={
                  theme === "dark"
                    ? "text-white font-semibold text-xl"
                    : "text-gray-900 font-semibold text-xl"
                }
              >
                Tracks
              </h3>
              <div className="text-sm text-gray-400">
                {selectedGenre ? `Showing ${genreTracks.length} tracks` : ""}
              </div>
            </div>

            {!selectedGenre && (
              <div
                className={theme === "dark" ? "text-white/60" : "text-gray-600"}
              >
                Select a genre from the left to browse tracks to add to a
                playlist.
              </div>
            )}

            {selectedGenre && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {genreTracks.map((t) => (
                  <div
                    key={t.trackId}
                    className={`relative ${theme === "dark" ? "bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)]" : "bg-white border border-gray-100"} rounded-md p-3 flex flex-col hover:shadow-lg transition`}
                  >
                    {/* Centered selected overlay */}
                    {selectedTracks[t.trackId] && (
                      <div
                        className="selected-overlay"
                        onClick={() => toggleTrack(t)}
                        role="button"
                        aria-label="Unselect track"
                      >
                        <div className="check-circle">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                        <LazyImage
                          src={t.artworkUrl100}
                          alt={t.trackName}
                          className="w-full h-full object-cover"
                          placeholder="cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className={
                            theme === "dark"
                              ? "text-white font-semibold"
                              : "text-gray-900 font-semibold"
                          }
                        >
                          {t.trackName}
                        </div>
                        <div
                          className={
                            theme === "dark"
                              ? "text-white/60 text-sm"
                              : "text-gray-500 text-sm"
                          }
                        >
                          {t.artistName}
                        </div>
                        <div
                          className={
                            theme === "dark"
                              ? "text-white/50 text-xs mt-2"
                              : "text-gray-400 text-xs mt-2"
                          }
                        >
                          {t.collectionName || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <Button
                        size="sm"
                        onClick={() => {
                          toggleTrack(t);
                        }}
                        className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white"
                      >
                        Select
                      </Button>
                      <div className="text-xs text-gray-400">
                        {Math.round((t.trackTimeMillis || 0) / 1000)}s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
