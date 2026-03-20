import { addHours, isBefore, isAfter } from "date-fns";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { notificationPreferences, sessions, users } from "../db/schema.js";
import { sessionReminderEmail } from "../lib/email.js";
import { notifyUser } from "../lib/notifications.js";

const cron = new Hono();

// Protect cron routes with a secret
cron.use("*", async (c, next) => {
	const cronSecret = c.req.header("x-cron-secret");
	if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});

// Send reminders for sessions happening in the next 24 hours
cron.post("/session-reminders", async (c) => {
	const now = new Date();
	const in24h = addHours(now, 24);
	const in25h = addHours(now, 25); // 1-hour window to avoid duplicates

	// Find confirmed sessions starting between 24h and 25h from now
	const upcomingSessions = await db
		.select()
		.from(sessions)
		.where(eq(sessions.status, "confirmed"));

	const sessionsToRemind = upcomingSessions.filter((s) => {
		return isAfter(s.startTime, in24h) && isBefore(s.startTime, in25h);
	});

	let sent = 0;

	for (const session of sessionsToRemind) {
		// Notify both therapist and client
		for (const userId of [session.therapistId, session.clientId]) {
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1);

			if (!user) continue;

			const [prefs] = await db
				.select()
				.from(notificationPreferences)
				.where(eq(notificationPreferences.userId, userId))
				.limit(1);

			const reminderHours = prefs?.reminderHours ?? 24;

			// Only send if user's reminder preference matches (within 1h of their preference)
			const reminderTime = addHours(now, reminderHours);
			const timeDiff = Math.abs(session.startTime.getTime() - reminderTime.getTime());
			if (timeDiff > 60 * 60 * 1000) continue; // Skip if more than 1h off from preference

			const email = sessionReminderEmail({
				recipientName: `${user.firstName} ${user.lastName}`,
				title: session.title,
				startTime: session.startTime,
				location: session.location,
			});

			await notifyUser({
				userId,
				title: "Session Reminder",
				body: `${session.title} is tomorrow at ${session.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
				emailSubject: email.subject,
				emailHtml: email.html,
				data: { type: "session_reminder", sessionId: session.id },
			});

			sent++;
		}
	}

	return c.json({ sent, sessionsChecked: sessionsToRemind.length });
});

export default cron;
