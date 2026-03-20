import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { Redirect, Slot } from "expo-router";
import { Paragraph, YStack, Spinner } from "tamagui";
import { useApiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useEffect } from "react";

export default function AppLayout() {
	const { isSignedIn, isLoaded } = useAuth();
	const api = useApiClient();
	const setDbUser = useAuthStore((s) => s.setDbUser);

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

	return <Slot />;
}
