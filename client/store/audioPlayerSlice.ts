import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Track, AudioPlayerState } from "@shared/types";

const initialState: AudioPlayerState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  queue: [],
  currentIndex: 0,
  shuffle: false,
};

const audioSlice = createSlice({
  name: "audioPlayer",
  initialState,
  reducers: {
    setTrack(state, action: PayloadAction<Track>) {
      state.currentTrack = action.payload;
      state.queue = [action.payload];
      state.currentIndex = 0;
    },
    setQueue(state, action: PayloadAction<{ tracks: Track[]; index: number }>) {
      state.queue = action.payload.tracks;
      state.currentIndex = action.payload.index;
      state.currentTrack = action.payload.tracks[action.payload.index] || null;
    },
    play(state) {
      state.isPlaying = true;
    },
    pause(state) {
      state.isPlaying = false;
    },
    next(state) {
      if (!state.queue || state.queue.length === 0) return;
      let nextIndex: number;
      if (state.shuffle) {
        if (state.queue.length === 1) nextIndex = 0;
        else {
          nextIndex = Math.floor(Math.random() * state.queue.length);
          if (nextIndex === state.currentIndex)
            nextIndex = (nextIndex + 1) % state.queue.length;
        }
      } else {
        nextIndex = Math.min(state.currentIndex + 1, state.queue.length - 1);
      }
      state.currentIndex = nextIndex;
      state.currentTrack = state.queue[nextIndex] || null;
    },
    previous(state) {
      if (!state.queue || state.queue.length === 0) return;
      let prevIndex: number;
      if (state.shuffle) {
        prevIndex = Math.floor(Math.random() * state.queue.length);
        if (prevIndex === state.currentIndex)
          prevIndex = (prevIndex - 1 + state.queue.length) % state.queue.length;
      } else {
        prevIndex = Math.max(state.currentIndex - 1, 0);
      }
      state.currentIndex = prevIndex;
      state.currentTrack = state.queue[prevIndex] || null;
    },
    toggleShuffle(state) {
      state.shuffle = !state.shuffle;
    },
    setCurrentTime(state, action: PayloadAction<number>) {
      state.currentTime = action.payload;
    },
    setDuration(state, action: PayloadAction<number>) {
      state.duration = action.payload;
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = action.payload;
    },
  },
});

export const {
  setTrack,
  setQueue,
  play,
  pause,
  next,
  previous,
  toggleShuffle,
  setCurrentTime,
  setDuration,
  setVolume,
} = audioSlice.actions;
export default audioSlice.reducer;
