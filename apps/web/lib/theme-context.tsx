"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

const ThemeContext = createContext<{
	mode: ThemeMode;
	setMode: (mode: ThemeMode) => void;
	isDark: boolean;
}>({
	mode: "system",
	setMode: () => {},
	isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [mode, setModeState] = useState<ThemeMode>("system");

	// Load saved preference
	useEffect(() => {
		const saved = localStorage.getItem("theme") as ThemeMode | null;
		if (saved) setModeState(saved);
	}, []);

	const setMode = (m: ThemeMode) => {
		setModeState(m);
		localStorage.setItem("theme", m);
	};

	// Resolve dark/light
	const [systemDark, setSystemDark] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		setSystemDark(mq.matches);
		const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	const isDark = mode === "system" ? systemDark : mode === "dark";

	// Apply class to <html>
	useEffect(() => {
		document.documentElement.classList.toggle("dark", isDark);
	}, [isDark]);

	return (
		<ThemeContext.Provider value={{ mode, setMode, isDark }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
