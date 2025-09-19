import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./themeSlice";
import authReducer from "./authSlice";
import audioPlayerReducer from "./audioPlayerSlice";
import { audioMiddleware } from "./audioMiddleware";

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    audioPlayer: audioPlayerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(audioMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
