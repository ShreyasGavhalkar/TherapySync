import { useColorScheme } from "react-native";
import { useThemeStore } from "./theme-store";

export function useThemeColors() {
	const systemScheme = useColorScheme();
	const themeMode = useThemeStore((s) => s.mode);
	const isDark = (themeMode === "system" ? systemScheme : themeMode) === "dark";

	return {
		isDark,
		bg: isDark ? "#111827" : "#F8F9FA",
		text: isDark ? "#F3F4F6" : "#111827",
		card: isDark ? "#1F2937" : "#FFFFFF",
		border: isDark ? "#374151" : "#E5E7EB",
		muted: isDark ? "#9CA3AF" : "#6B7280",
	};
}
