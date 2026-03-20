import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { notificationPreferences, pushTokensTable, users } from "../db/schema.js";
import { sendPushNotifications } from "./push.js";
import { sendEmail } from "./email.js";

type NotifyParams = {
	userId: string;
	title: string;
	body: string;
	emailSubject?: string;
	emailHtml?: string;
	data?: Record<string, unknown>;
};

export async function notifyUser({
	userId,
	title,
	body,
	emailSubject,
	emailHtml,
	data,
}: NotifyParams) {
	// Fetch user and notification preferences
	const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

	if (!user) return;

	const [prefs] = await db
		.select()
		.from(notificationPreferences)
		.where(eq(notificationPreferences.userId, userId))
		.limit(1);

	const pushEnabled = prefs?.pushEnabled ?? true;
	const emailEnabled = prefs?.emailEnabled ?? true;

	// Push notification
	if (pushEnabled) {
		const tokens = await db
			.select({ token: pushTokensTable.token })
			.from(pushTokensTable)
			.where(eq(pushTokensTable.userId, userId));

		if (tokens.length > 0) {
			await sendPushNotifications({
				pushTokens: tokens.map((t) => t.token),
				title,
				body,
				data,
			});
		}
	}

	// Email notification
	if (emailEnabled && emailSubject && emailHtml) {
		await sendEmail({
			to: user.email,
			subject: emailSubject,
			html: emailHtml,
		});
	}
}

export async function notifySessionParticipants(params: {
	therapistId: string;
	clientId: string;
	title: string;
	body: string;
	emailSubject?: string;
	emailHtml?: string;
	excludeUserId?: string;
	data?: Record<string, unknown>;
}) {
	const userIds = [params.therapistId, params.clientId].filter(
		(id) => id !== params.excludeUserId,
	);

	await Promise.all(
		userIds.map((userId) =>
			notifyUser({
				userId,
				title: params.title,
				body: params.body,
				emailSubject: params.emailSubject,
				emailHtml: params.emailHtml,
				data: params.data,
			}),
		),
	);
}
