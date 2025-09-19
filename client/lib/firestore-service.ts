import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, hasValidConfig } from "./firebase";

// Runtime toggle: if localStorage key 'useLocalStorage' === '1' then always use localStorage for user data.
function useLocalStorageMode() {
  try {
    const v = localStorage.getItem("useLocalStorage");
    if (v === "1") return true;
  } catch (e) {
    // ignore
  }
  // Default to local storage per user request
  return true;
}
import type { Track, Playlist, UserFavorites } from "@shared/types";

// Helper for local fallback storage
function localKey(kind: string, userId: string) {
  return `local_${kind}_${userId}`;
}

function readLocal<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch (e) {
    console.warn("Failed to read localStorage", e);
    return null;
  }
}

function writeLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to write localStorage", e);
  }
}

// Favorites functionality
export async function getUserFavorites(userId: string): Promise<Track[]> {
  if (useLocalStorageMode()) {
    const key = localKey("favorites", userId);
    const stored = readLocal<Track[]>(key);
    return stored || [];
  }

  try {
    const favoritesRef = doc(db, "favorites", userId);
    const favoritesSnap = await getDoc(favoritesRef);

    if (favoritesSnap.exists()) {
      const data = favoritesSnap.data() as UserFavorites;
      return data.tracks || [];
    }

    return [];
  } catch (error) {
    console.error("Error getting favorites:", error);
    throw new Error("Failed to get favorites");
  }
}

export async function addToFavorites(
  userId: string,
  track: Track,
): Promise<void> {
  if (useLocalStorageMode()) {
    const key = localKey("favorites", userId);
    const current = (readLocal<Track[]>(key) || []).slice();
    if (!current.some((t) => t.trackId === track.trackId)) {
      current.push(track);
      writeLocal(key, current);
      // Notify app of update
      try {
        window.dispatchEvent(
          new CustomEvent("favorites-updated", { detail: { userId } }),
        );
      } catch (e) {}
    }
    return;
  }

  try {
    const favoritesRef = doc(db, "favorites", userId);
    const favoritesSnap = await getDoc(favoritesRef);

    if (favoritesSnap.exists()) {
      await updateDoc(favoritesRef, {
        tracks: arrayUnion(track),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(favoritesRef, {
        userId,
        tracks: [track],
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error adding to favorites:", error);
    throw new Error("Failed to add to favorites");
  }
}

export async function removeFromFavorites(
  userId: string,
  track: Track,
): Promise<void> {
  if (useLocalStorageMode()) {
    const key = localKey("favorites", userId);
    const current = (readLocal<Track[]>(key) || []).slice();
    const updated = current.filter((t) => t.trackId !== track.trackId);
    writeLocal(key, updated);
    try {
      window.dispatchEvent(
        new CustomEvent("favorites-updated", { detail: { userId } }),
      );
    } catch (e) {}
    return;
  }

  try {
    const favoritesRef = doc(db, "favorites", userId);
    const favSnap = await getDoc(favoritesRef);
    if (favSnap.exists()) {
      const data = favSnap.data() as UserFavorites;
      const updated = (data.tracks || []).filter(
        (t: Track) => t.trackId !== track.trackId,
      );
      await updateDoc(favoritesRef, {
        tracks: updated,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw new Error("Failed to remove from favorites");
  }
}

export async function isTrackFavorited(
  userId: string,
  trackId: number,
): Promise<boolean> {
  try {
    const favorites = await getUserFavorites(userId);
    return favorites.some((track) => track.trackId === trackId);
  } catch (error) {
    console.error("Error checking if track is favorited:", error);
    return false;
  }
}

// Recently played functionality
export async function getRecentlyPlayed(userId: string): Promise<Track[]> {
  if (useLocalStorageMode()) {
    const key = localKey("recent", userId);
    const stored = readLocal<any[]>(key) || [];
    // stored entries are { trackData, playedAt } — normalize to Track[] for UI
    try {
      return stored
        .map((s) => (s && s.trackData ? s.trackData : s))
        .filter(Boolean) as Track[];
    } catch (e) {
      console.warn("Failed to normalize recently played from localStorage", e);
      return [];
    }
  }

  try {
    const recentRef = doc(db, "recent", userId);
    const snap = await getDoc(recentRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data.tracks || []).map((t: any) => t.trackData || t);
    }
    return [];
  } catch (err) {
    console.error("Error getting recently played:", err);
    return [];
  }
}

export async function recordRecentlyPlayed(
  userId: string,
  track: Track,
): Promise<void> {
  if (useLocalStorageMode()) {
    const key = localKey("recent", userId);
    const current = readLocal<any[]>(key) || [];
    // remove existing
    const filtered = current.filter(
      (t) => (t.trackData ? t.trackData.trackId : t.trackId) !== track.trackId,
    );
    filtered.unshift({ trackData: track, playedAt: new Date() });
    // limit
    const limited = filtered.slice(0, 50);
    writeLocal(key, limited);

    // Update play counts for simple analytics (local mode)
    try {
      const countsKey = localKey("play_counts", userId);
      const currentCounts = readLocal<Record<number, number>>(countsKey) || {};
      const idKey = String(track.trackId);
      currentCounts[idKey] = (currentCounts[idKey] || 0) + 1;
      writeLocal(countsKey, currentCounts);
      try {
        window.dispatchEvent(
          new CustomEvent("play-counts-updated", { detail: { userId } }),
        );
      } catch (e) {}
    } catch (e) {
      console.warn("Failed to update play counts", e);
    }

    try {
      window.dispatchEvent(
        new CustomEvent("recent-updated", { detail: { userId } }),
      );
    } catch (e) {}
    return;
  }

  try {
    const recentRef = doc(db, "recent", userId);
    const snap = await getDoc(recentRef);
    let tracks: any[] = [];
    if (snap.exists()) {
      tracks = snap.data().tracks || [];
      // filter out existing
      tracks = tracks.filter(
        (t: any) =>
          (t.trackData ? t.trackData.trackId : t.trackId) !== track.trackId,
      );
    }
    tracks.unshift({ trackData: track, playedAt: serverTimestamp() });
    // keep last 50
    tracks = tracks.slice(0, 50);
    await setDoc(
      recentRef,
      { tracks, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    console.error("Failed to record recently played", err);
  }
}

// Simple analytics helper to read play counts (local mode)
export async function getPlayCounts(
  userId: string,
): Promise<Record<string, number>> {
  if (useLocalStorageMode()) {
    const key = localKey("play_counts", userId);
    const stored = readLocal<Record<string, number>>(key) || {};
    return stored;
  }

  // Server mode: not implemented, return empty
  return {};
}

export async function clearRecentlyPlayed(userId: string): Promise<void> {
  if (useLocalStorageMode()) {
    const key = localKey("recent", userId);
    try {
      localStorage.removeItem(key);
      try {
        window.dispatchEvent(
          new CustomEvent("recent-updated", { detail: { userId } }),
        );
      } catch (e) {}
    } catch (e) {
      console.error("Failed to clear recent localStorage", e);
    }
    return;
  }

  try {
    const recentRef = doc(db, "recent", userId);
    await setDoc(
      recentRef,
      { tracks: [], updatedAt: serverTimestamp() },
      { merge: true },
    );
    try {
      window.dispatchEvent(
        new CustomEvent("recent-updated", { detail: { userId } }),
      );
    } catch (e) {}
  } catch (err) {
    console.error("Failed to clear recently played", err);
  }
}

// Playlists functionality
export async function createPlaylist(
  userId: string,
  name: string,
  description?: string,
): Promise<string> {
  if (useLocalStorageMode()) {
    const key = localKey("playlists", userId);
    const current = readLocal<Playlist[]>(key) || [];
    const id = `local_${Date.now()}`;
    const pl: Playlist = {
      id,
      name,
      description: description || "",
      userId,
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    current.unshift(pl);
    writeLocal(key, current);
    try {
      window.dispatchEvent(
        new CustomEvent("playlists-updated", { detail: {} }),
      );
    } catch (e) {}
    return id;
  }

  try {
    const playlistsRef = collection(db, "playlists");
    const docRef = await addDoc(playlistsRef, {
      name,
      description: description || "",
      userId,
      tracks: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating playlist:", error);
    throw new Error("Failed to create playlist");
  }
}

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  if (useLocalStorageMode()) {
    const key = localKey("playlists", userId);
    return readLocal<Playlist[]>(key) || [];
  }

  try {
    const playlistsRef = collection(db, "playlists");
    const q = query(
      playlistsRef,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
    );

    const querySnapshot = await getDocs(q);
    const playlists: Playlist[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      playlists.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        userId: data.userId,
        tracks: data.tracks || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return playlists;
  } catch (error) {
    console.error("Error getting playlists:", error);
    throw new Error("Failed to get playlists");
  }
}

export async function addTrackToPlaylist(
  playlistId: string,
  track: Track,
): Promise<void> {
  if (useLocalStorageMode()) {
    // find playlist in local storage
    const keyPrefix = "local_playlists_";
    // naive scan all keys
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (k.startsWith(keyPrefix)) {
        const pls = readLocal<Playlist[]>(k) || [];
        const idx = pls.findIndex((p) => p.id === playlistId);
        if (idx >= 0) {
          const id = `${playlistId}_${track.trackId}_${Date.now()}`;
          pls[idx].tracks = pls[idx].tracks || [];
          pls[idx].tracks.push({
            id,
            trackData: track,
            addedAt: new Date(),
          } as any);
          pls[idx].updatedAt = new Date();
          writeLocal(k, pls);
          try {
            window.dispatchEvent(
              new CustomEvent("playlists-updated", { detail: {} }),
            );
          } catch (e) {}
          return;
        }
      }
    }
    throw new Error("Playlist not found");
  }

  try {
    const playlistRef = doc(db, "playlists", playlistId);
    const playlistTrack = {
      id: `${playlistId}_${track.trackId}_${Date.now()}`,
      trackData: track,
      addedAt: serverTimestamp(),
    };

    await updateDoc(playlistRef, {
      tracks: arrayUnion(playlistTrack),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding track to playlist:", error);
    throw new Error("Failed to add track to playlist");
  }
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<void> {
  if (useLocalStorageMode()) {
    const keyPrefix = "local_playlists_";
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (k.startsWith(keyPrefix)) {
        const pls = readLocal<Playlist[]>(k) || [];
        const idx = pls.findIndex((p) => p.id === playlistId);
        if (idx >= 0) {
          pls[idx].tracks = (pls[idx].tracks || []).filter(
            (t: any) => t.id !== trackId,
          );
          pls[idx].updatedAt = new Date();
          writeLocal(k, pls);
          try {
            window.dispatchEvent(
              new CustomEvent("playlists-updated", { detail: {} }),
            );
          } catch (e) {}
          return;
        }
      }
    }
    throw new Error("Playlist not found");
  }

  try {
    const playlistRef = doc(db, "playlists", playlistId);
    const playlistSnap = await getDoc(playlistRef);

    if (playlistSnap.exists()) {
      const data = playlistSnap.data();
      const updatedTracks = data.tracks.filter(
        (track: any) => track.id !== trackId,
      );

      await updateDoc(playlistRef, {
        tracks: updatedTracks,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error removing track from playlist:", error);
    throw new Error("Failed to remove track from playlist");
  }
}

export async function deletePlaylist(
  playlistId: string,
  userId: string,
): Promise<void> {
  if (useLocalStorageMode()) {
    const key = localKey("playlists", userId);
    const playlists = readLocal<Playlist[]>(key) || [];
    const updatedPlaylists = playlists.filter((p) => p.id !== playlistId);
    writeLocal(key, updatedPlaylists);
    try {
      window.dispatchEvent(
        new CustomEvent("playlists-updated", { detail: { userId } }),
      );
    } catch (e) {}
    return;
  }

  try {
    const playlistRef = doc(db, "playlists", playlistId);
    await deleteDoc(playlistRef);
  } catch (error) {
    console.error("Error deleting playlist:", error);
    throw new Error("Failed to delete playlist");
  }
}

export async function updatePlaylist(
  playlistId: string,
  updates: { name?: string; description?: string },
): Promise<void> {
  if (useLocalStorageMode()) {
    const keyPrefix = "local_playlists_";
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (k.startsWith(keyPrefix)) {
        const pls = readLocal<Playlist[]>(k) || [];
        const idx = pls.findIndex((p) => p.id === playlistId);
        if (idx >= 0) {
          pls[idx] = { ...pls[idx], ...updates, updatedAt: new Date() } as any;
          writeLocal(k, pls);
          try {
            window.dispatchEvent(
              new CustomEvent("playlists-updated", { detail: {} }),
            );
          } catch (e) {}
          return;
        }
      }
    }
    throw new Error("Playlist not found");
  }

  try {
    const playlistRef = doc(db, "playlists", playlistId);
    await updateDoc(playlistRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating playlist:", error);
    throw new Error("Failed to update playlist");
  }
}
