import { create } from "zustand";

type ThemeMode = "system" | "light" | "dark";

type ThemeState = {
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
	mode: "system",
	setMode: (mode) => set({ mode }),
}));
