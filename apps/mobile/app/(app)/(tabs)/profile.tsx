import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Switch } from "react-native";
import { H4, Paragraph, Separator, XStack, YStack, Spinner } from "tamagui";
import { Button } from "@therapysync/ui";
import { useAuthStore } from "@/lib/auth-store";
import { useThemeStore } from "@/lib/theme-store";
import {
	useNotificationPreferences,
	useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";

type ThemeMode = "system" | "light" | "dark";

export default function ProfileScreen() {
	const { signOut } = useAuth();
	const { user: clerkUser } = useUser();
	const router = useRouter();
	const dbUser = useAuthStore((s) => s.dbUser);
	const clearDbUser = useAuthStore((s) => s.clearDbUser);
	const themeMode = useThemeStore((s) => s.mode);
	const setThemeMode = useThemeStore((s) => s.setMode);

	const { data: prefs, isLoading: prefsLoading } = useNotificationPreferences();
	const updatePrefs = useUpdateNotificationPreferences();

	const queryClient = useQueryClient();

	const handleSignOut = async () => {
		clearDbUser();
		queryClient.clear();
		await signOut();
		router.replace("/(auth)/sign-in");
	};

	const displayName = dbUser?.firstName
		? `${dbUser.firstName} ${dbUser.lastName}`
		: clerkUser?.fullName ?? "User";
	const displayEmail = dbUser?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? "";
	const displayRole = dbUser?.role ?? "client";
	const initials = dbUser?.firstName
		? `${dbUser.firstName[0]}${dbUser.lastName[0]}`
		: clerkUser?.firstName
			? `${clerkUser.firstName[0]}${clerkUser.lastName?.[0] ?? ""}`
			: "U";

	return (
		<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
			{/* Header */}
			<YStack alignItems="center" paddingVertical="$6" gap="$2">
				<YStack
					width={80}
					height={80}
					borderRadius={40}
					backgroundColor="$blue5"
					alignItems="center"
					justifyContent="center"
				>
					<Paragraph fontSize="$8" fontWeight="700" color="$blue10">
						{initials}
					</Paragraph>
				</YStack>
				<Paragraph fontSize="$7" fontWeight="700" color="$color">
					{displayName}
				</Paragraph>
				<Paragraph color="$color11" fontSize="$4">{displayEmail}</Paragraph>
				<YStack backgroundColor="$blue4" paddingHorizontal="$3" paddingVertical="$1" borderRadius="$2">
					<Paragraph color="$blue11" fontSize="$2" fontWeight="600" textTransform="uppercase">
						{displayRole}
					</Paragraph>
				</YStack>
			</YStack>

			{/* Account Section */}
			<Section title="Account">
				<Row label="Email" value={displayEmail} />
				<Separator marginVertical="$2" />
				<Row
					label="Member since"
					value={clerkUser?.createdAt ? new Date(clerkUser.createdAt).toLocaleDateString() : "-"}
				/>
			</Section>

			{/* Appearance Section */}
			<Section title="Appearance">
				<Paragraph color="$color11" fontSize="$3" marginBottom="$2">Theme</Paragraph>
				<XStack gap="$2">
					{(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
						<Pressable key={mode} onPress={() => setThemeMode(mode)} style={{ flex: 1 }}>
							<YStack
								padding="$2"
								borderRadius="$3"
								borderWidth={2}
								borderColor={themeMode === mode ? "$blue8" : "$color4"}
								backgroundColor={themeMode === mode ? "$blue3" : "transparent"}
								alignItems="center"
							>
								<Paragraph
									fontSize="$3"
									fontWeight="600"
									color={themeMode === mode ? "$blue11" : "$color11"}
									textTransform="capitalize"
								>
									{mode}
								</Paragraph>
							</YStack>
						</Pressable>
					))}
				</XStack>
			</Section>

			{/* Notifications Section */}
			<Section title="Notifications">
				{prefsLoading ? (
					<Spinner size="small" color="$blue10" />
				) : (
					<>
						<XStack justifyContent="space-between" alignItems="center">
							<Paragraph color="$color">Push Notifications</Paragraph>
							<Switch
								value={prefs?.pushEnabled ?? true}
								onValueChange={(value) => updatePrefs.mutate({ pushEnabled: value })}
								trackColor={{ true: "#6C63FF", false: "#767577" }}
								thumbColor="#fff"
							/>
						</XStack>
						<Separator marginVertical="$2" />
						<XStack justifyContent="space-between" alignItems="center">
							<Paragraph color="$color">Email Notifications</Paragraph>
							<Switch
								value={prefs?.emailEnabled ?? true}
								onValueChange={(value) => updatePrefs.mutate({ emailEnabled: value })}
								trackColor={{ true: "#6C63FF", false: "#767577" }}
								thumbColor="#fff"
							/>
						</XStack>
						<Separator marginVertical="$2" />
						<XStack justifyContent="space-between" alignItems="center">
							<Paragraph color="$color">Reminder before session</Paragraph>
							<Paragraph color="$color11" fontWeight="600">
								{prefs?.reminderHours ?? 24}h
							</Paragraph>
						</XStack>
					</>
				)}
			</Section>

			<YStack paddingHorizontal="$4" marginTop="$4">
				<Button variant="danger" onPress={handleSignOut}>
					Sign Out
				</Button>
			</YStack>
		</ScrollView>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<YStack paddingHorizontal="$4" marginTop="$4">
			<Paragraph fontSize="$2" fontWeight="700" color="$color10" textTransform="uppercase" marginBottom="$2">
				{title}
			</Paragraph>
			<YStack backgroundColor="$color2" borderRadius="$4" padding="$4">
				{children}
			</YStack>
		</YStack>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<XStack justifyContent="space-between" alignItems="center">
			<Paragraph color="$color">{label}</Paragraph>
			<Paragraph color="$color11" fontSize="$3">{value}</Paragraph>
		</XStack>
	);
}
