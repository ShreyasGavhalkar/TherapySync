import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { notificationPreferences } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const notifPrefs = new Hono();

notifPrefs.use("*", authMiddleware);

// Get current user's notification preferences
notifPrefs.get("/", async (c) => {
	const user = c.get("user");
	const [prefs] = await db
		.select()
		.from(notificationPreferences)
		.where(eq(notificationPreferences.userId, user.id))
		.limit(1);

	if (!prefs) {
		// Create defaults if missing
		const [created] = await db
			.insert(notificationPreferences)
			.values({ userId: user.id })
			.returning();
		return c.json(created);
	}

	return c.json(prefs);
});

// Update notification preferences
notifPrefs.patch("/", async (c) => {
	const user = c.get("user");
	const body = await c.req.json();

	const updates: Record<string, unknown> = {};
	if (typeof body.pushEnabled === "boolean") updates.pushEnabled = body.pushEnabled;
	if (typeof body.emailEnabled === "boolean") updates.emailEnabled = body.emailEnabled;
	if (typeof body.reminderHours === "number") updates.reminderHours = body.reminderHours;

	const [updated] = await db
		.update(notificationPreferences)
		.set(updates)
		.where(eq(notificationPreferences.userId, user.id))
		.returning();

	if (!updated) return c.json({ error: "Preferences not found" }, 404);
	return c.json(updated);
});

export default notifPrefs;
