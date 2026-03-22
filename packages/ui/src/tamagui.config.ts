import { createTamagui } from "tamagui";
import { config } from "@tamagui/config/v3";

export const tamaguiConfig = createTamagui({
	...config,
	themes: {
		...config.themes,
		light: {
			...config.themes.light,
			background: "#FFFFFF",
			color: "#1A1A2E",
			primary: "#6C63FF",
			primaryFocus: "#5A52D5",
		},
		dark: {
			...config.themes.dark,
			background: "#1A1A2E",
			color: "#E0E0E0",
			primary: "#6C63FF",
			primaryFocus: "#8B85FF",
		},
	},
});

export default tamaguiConfig;
export type TamaguiConfig = typeof tamaguiConfig;

declare module "tamagui" {
	interface TamaguiCustomConfig extends TamaguiConfig {}
}
