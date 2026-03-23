import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { Paragraph, YStack, Spinner } from "tamagui";
import { useApiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useThemeStore } from "@/lib/theme-store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useEffect } from "react";

export default function AppLayout() {
	const { isSignedIn, isLoaded } = useAuth();
	const api = useApiClient();
	const setDbUser = useAuthStore((s) => s.setDbUser);
	const systemScheme = useColorScheme();
	const themeMode = useThemeStore((s) => s.mode);
	const isDark = (themeMode === "system" ? systemScheme : themeMode) === "dark";
	const headerBg = isDark ? "#1A1A2E" : "#6C63FF";

	usePushNotifications();

	const { data: user, isLoading } = useQuery({
		queryKey: ["me"],
		queryFn: () => api.get<any>("/auth/me"),
		enabled: isSignedIn === true,
	});

	useEffect(() => {
		if (user) {
			setDbUser({
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				avatarUrl: user.avatarUrl,
			});
		}
	}, [user, setDbUser]);

	if (!isLoaded || isLoading) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
				<Spinner size="large" color="$primary" />
				<Paragraph marginTop="$3" color="$gray10">
					Loading...
				</Paragraph>
			</YStack>
		);
	}

	if (!isSignedIn) {
		return <Redirect href="/(auth)/sign-in" />;
	}

	const bg = isDark ? "#111827" : "#F8F9FA";

	return (
		<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bg } }}>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen
				name="session"
				options={{
					headerShown: true,
					headerStyle: { backgroundColor: headerBg },
					headerTintColor: "#fff",
					title: "Session",
				}}
			/>
			<Stack.Screen
				name="homework"
				options={{
					headerShown: true,
					headerStyle: { backgroundColor: headerBg },
					headerTintColor: "#fff",
					title: "Homework",
				}}
			/>
			<Stack.Screen
				name="payment"
				options={{
					headerShown: true,
					headerStyle: { backgroundColor: headerBg },
					headerTintColor: "#fff",
					title: "Payment",
				}}
			/>
			<Stack.Screen
				name="client"
				options={{
					headerShown: true,
					headerStyle: { backgroundColor: headerBg },
					headerTintColor: "#fff",
					title: "Client",
				}}
			/>
			<Stack.Screen
				name="client-detail"
				options={{
					headerShown: true,
					headerStyle: { backgroundColor: headerBg },
					headerTintColor: "#fff",
					title: "Details",
				}}
			/>
			<Stack.Screen
				name="therapist"
				options={{
					headerShown: true,
					headerStyle: { backgroundColor: headerBg },
					headerTintColor: "#fff",
					title: "Therapist",
				}}
			/>
		</Stack>
	);
}
