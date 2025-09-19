import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ThemeState = {
  theme: "light" | "dark";
  accentColor: string;
  glowEnabled: boolean;
};

const initialState: ThemeState = {
  theme:
    (typeof window !== "undefined" &&
      (localStorage.getItem("theme") as "light" | "dark")) ||
    "dark",
  accentColor:
    (typeof window !== "undefined" &&
      (localStorage.getItem("accentColor") || "#60a5fa")) ||
    "#60a5fa",
  glowEnabled:
    (typeof window !== "undefined" &&
      localStorage.getItem("glowEnabled") === "1") ||
    true,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<"light" | "dark">) {
      state.theme = action.payload;
      try {
        localStorage.setItem("theme", action.payload);
      } catch (e) {}
    },
    toggleTheme(state) {
      state.theme = state.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", state.theme);
      } catch (e) {}
    },
    setAccentColor(state, action: PayloadAction<string>) {
      state.accentColor = action.payload;
      try {
        localStorage.setItem("accentColor", action.payload);
      } catch (e) {}
    },
    setGlowEnabled(state, action: PayloadAction<boolean>) {
      state.glowEnabled = action.payload;
      try {
        localStorage.setItem("glowEnabled", action.payload ? "1" : "0");
      } catch (e) {}
    },
  },
});

export const { setTheme, toggleTheme, setAccentColor, setGlowEnabled } =
  themeSlice.actions;
export default themeSlice.reducer;
