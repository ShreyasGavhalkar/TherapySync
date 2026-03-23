import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: "class",
	content: [
		"./app/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./lib/**/*.{ts,tsx}",
	],
	theme: {
		extend: {
			colors: {
				primary: "#6C63FF",
				"primary-dark": "#5A52D5",
			},
			ringColor: {
				primary: "#6C63FF",
			},
		},
	},
	plugins: [],
};
export default config;
