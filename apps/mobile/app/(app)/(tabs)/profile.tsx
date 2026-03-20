import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { H3, H4, Paragraph, Separator, XStack, YStack } from "tamagui";
import { Button, Card } from "@therapysync/ui";
import { useAuthStore } from "@/lib/auth-store";

export default function ProfileScreen() {
	const { signOut } = useAuth();
	const { user: clerkUser } = useUser();
	const router = useRouter();
	const dbUser = useAuthStore((s) => s.dbUser);
	const clearDbUser = useAuthStore((s) => s.clearDbUser);

	const handleSignOut = async () => {
		clearDbUser();
		await signOut();
		router.replace("/(auth)/sign-in");
	};

	return (
		<YStack flex={1} padding="$4" gap="$4" backgroundColor="$background">
			<Card>
				<YStack gap="$2" alignItems="center" padding="$4">
					<H3>
						{dbUser?.firstName} {dbUser?.lastName}
					</H3>
					<Paragraph color="$gray10">{dbUser?.email}</Paragraph>
					<Paragraph
						color="$primary"
						fontSize="$3"
						textTransform="uppercase"
						fontWeight="600"
					>
						{dbUser?.role}
					</Paragraph>
				</YStack>
			</Card>

			<Card>
				<YStack gap="$3">
					<H4>Account</H4>
					<Separator />
					<XStack justifyContent="space-between">
						<Paragraph>Email</Paragraph>
						<Paragraph color="$gray10">{clerkUser?.primaryEmailAddress?.emailAddress}</Paragraph>
					</XStack>
					<XStack justifyContent="space-between">
						<Paragraph>Member since</Paragraph>
						<Paragraph color="$gray10">
							{clerkUser?.createdAt ? new Date(clerkUser.createdAt).toLocaleDateString() : "-"}
						</Paragraph>
					</XStack>
				</YStack>
			</Card>

			<Button variant="danger" onPress={handleSignOut}>
				Sign Out
			</Button>
		</YStack>
	);
}
