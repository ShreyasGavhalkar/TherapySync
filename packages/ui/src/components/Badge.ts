import { styled, Text } from "tamagui";

export const Badge = styled(Text, {
	paddingHorizontal: "$2",
	paddingVertical: "$1",
	borderRadius: "$2",
	fontSize: "$2",
	fontWeight: "600",

	variants: {
		status: {
			success: {
				backgroundColor: "$green3",
				color: "$green11",
			},
			warning: {
				backgroundColor: "$yellow3",
				color: "$yellow11",
			},
			error: {
				backgroundColor: "$red3",
				color: "$red11",
			},
			info: {
				backgroundColor: "$blue3",
				color: "$blue11",
			},
			neutral: {
				backgroundColor: "$gray3",
				color: "$gray11",
			},
		},
	} as const,

	defaultVariants: {
		status: "neutral",
	},
});
