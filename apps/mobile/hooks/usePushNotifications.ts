import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useAuth } from "@clerk/clerk-expo";
import { useApiClient } from "@/lib/api";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: true,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

export function usePushNotifications() {
	const { isSignedIn } = useAuth();
	const api = useApiClient();
	const tokenRef = useRef<string | null>(null);

	useEffect(() => {
		if (!isSignedIn) return;

		async function registerForPush() {
			if (!Device.isDevice) {
				console.log("Push notifications require a physical device");
				return;
			}

			const { status: existingStatus } = await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;

			if (existingStatus !== "granted") {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}

			if (finalStatus !== "granted") {
				console.log("Push notification permission not granted");
				return;
			}

			const pushToken = await Notifications.getExpoPushTokenAsync();
			tokenRef.current = pushToken.data;

			// Register token with backend
			try {
				await api.post("/push-tokens", { token: pushToken.data });
			} catch (error) {
				console.error("Failed to register push token:", error);
			}

			// Android notification channel
			if (Platform.OS === "android") {
				Notifications.setNotificationChannelAsync("default", {
					name: "default",
					importance: Notifications.AndroidImportance.MAX,
				});
			}
		}

		registerForPush();
	}, [isSignedIn, api]);

	return { token: tokenRef.current };
}
