import { styled, YStack } from "tamagui";

export const Card = styled(YStack, {
	backgroundColor: "$background",
	borderRadius: "$4",
	padding: "$4",
	borderWidth: 1,
	borderColor: "$borderColor",
	shadowColor: "$shadowColor",
	shadowOffset: { width: 0, height: 2 },
	shadowOpacity: 0.1,
	shadowRadius: 4,
	elevation: 2,
});
