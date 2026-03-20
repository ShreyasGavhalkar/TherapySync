import { Expo, type ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

type PushPayload = {
	pushTokens: string[];
	title: string;
	body: string;
	data?: Record<string, unknown>;
};

export async function sendPushNotifications({ pushTokens, title, body, data }: PushPayload) {
	const messages: ExpoPushMessage[] = [];

	for (const token of pushTokens) {
		if (!Expo.isExpoPushToken(token)) {
			console.warn(`Invalid Expo push token: ${token}`);
			continue;
		}
		messages.push({ to: token, title, body, data, sound: "default" });
	}

	if (messages.length === 0) return;

	const chunks = expo.chunkPushNotifications(messages);

	for (const chunk of chunks) {
		try {
			const receipts = await expo.sendPushNotificationsAsync(chunk);
			for (const receipt of receipts) {
				if (receipt.status === "error") {
					console.error("Push notification error:", receipt.message);
				}
			}
		} catch (error) {
			console.error("Failed to send push notifications:", error);
		}
	}
}
