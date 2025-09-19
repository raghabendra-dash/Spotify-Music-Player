import { Middleware, PayloadAction } from "@reduxjs/toolkit";
import {
  play,
  pause,
  setVolume,
  setTrack,
  setCurrentTime,
  setDuration,
  next,
} from "./audioPlayerSlice";
import type { Track } from "@shared/types";

// This middleware is responsible for managing the actual HTML5 audio element
// in response to actions dispatched to the audioPlayer slice.

let audio: HTMLAudioElement | null = null;

export const audioMiddleware: Middleware =
  (store) => (nextMiddleware) => (action) => {
    if (typeof window === "undefined") {
      return nextMiddleware(action);
    }

    // Ensure the audio element is created and available.
    if (!audio) {
      audio = new Audio();
      audio.preload = "auto";
      document.body.appendChild(audio);

      audio.addEventListener("timeupdate", () => {
        store.dispatch(setCurrentTime(audio!.currentTime));
      });
      audio.addEventListener("durationchange", () => {
        store.dispatch(setDuration(audio!.duration));
      });
      audio.addEventListener("ended", () => {
        store.dispatch(next());
      });
    }

    const { type, payload } = action as PayloadAction<any>;

    // Handle specific audio actions.
    switch (type) {
      case setTrack.type:
        audio.src = (payload as Track).previewUrl;
        break;

      case play.type:
        audio.play().catch((e) => console.error("Playback failed:", e));
        break;

      case pause.type:
        audio.pause();
        break;

      case setVolume.type:
        audio.volume = payload as number;
        audio.muted = payload === 0;
        break;

      default:
        break;
    }

    return nextMiddleware(action);
  };
