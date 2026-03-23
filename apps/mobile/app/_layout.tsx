// Polyfill WeakRef if missing (some Hermes versions)
if (typeof globalThis.WeakRef === "undefined") {
	globalThis.WeakRef = class WeakRef<T extends object> {
		private _target: T | undefined;
		constructor(target: T) { this._target = target; }
		deref(): T | undefined { return this._target; }
	} as any;
}

import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { TamaguiProvider, Theme } from "tamagui";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import tamaguiConfig from "../tamagui.config";
import { QueryProvider } from "@/lib/query-provider";
import { tokenCache } from "@/lib/token-cache";
import { useThemeStore } from "@/lib/theme-store";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
	throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is required");
}

export default function RootLayout() {
	const systemScheme = useColorScheme();
	const themeMode = useThemeStore((s) => s.mode);

	const resolvedTheme = themeMode === "system"
		? (systemScheme ?? "light")
		: themeMode;

	return (
		<ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
			<ClerkLoaded>
				<TamaguiProvider config={tamaguiConfig} defaultTheme={resolvedTheme}>
					<Theme name={resolvedTheme}>
						<QueryProvider>
							<StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
							<Slot />
						</QueryProvider>
					</Theme>
				</TamaguiProvider>
			</ClerkLoaded>
		</ClerkProvider>
	);
}
