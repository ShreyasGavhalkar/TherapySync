import { styled, Input as TamaguiInput } from "tamagui";

export const Input = styled(TamaguiInput, {
	borderWidth: 1,
	borderColor: "$borderColor",
	borderRadius: "$3",
	paddingHorizontal: "$3",
	height: 44,
	fontSize: "$4",

	focusStyle: {
		borderColor: "$blue8",
		borderWidth: 2,
	},
});
