import { styled } from "tamagui";
import { Button as TamaguiButton } from "tamagui";

export const Button = styled(TamaguiButton, {
	borderRadius: "$4",
	fontWeight: "600",

	variants: {
		variant: {
			primary: {
				backgroundColor: "$primary",
				color: "white",
				pressStyle: {
					backgroundColor: "$primaryFocus",
				},
			},
			secondary: {
				backgroundColor: "$backgroundFocus",
				borderWidth: 1,
				borderColor: "$borderColor",
			},
			danger: {
				backgroundColor: "$red10",
				color: "white",
			},
			ghost: {
				backgroundColor: "transparent",
			},
		},
		size: {
			sm: {
				height: 36,
				paddingHorizontal: "$3",
				fontSize: "$3",
			},
			md: {
				height: 44,
				paddingHorizontal: "$4",
				fontSize: "$4",
			},
			lg: {
				height: 52,
				paddingHorizontal: "$5",
				fontSize: "$5",
			},
		},
	} as const,

	defaultVariants: {
		variant: "primary",
		size: "md",
	},
});
