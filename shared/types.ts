export interface Track {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  artworkUrl60: string;
  previewUrl: string | null;
  trackTimeMillis: number;
  releaseDate: string;
  country: string;
  currency: string;
  trackPrice: number;
  collectionPrice: number;
}

export interface SearchResult {
  resultCount: number;
  results: Track[];
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface PlaylistTrack {
  id: string;
  trackData: Track;
  addedAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  tracks: PlaylistTrack[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFavorites {
  userId: string;
  tracks: Track[];
  updatedAt: Date;
}

export interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Track[];
  currentIndex: number;
  shuffle?: boolean;
}
