import { Hono } from "hono";
import { Webhook } from "svix";
import { db } from "../db/index.js";
import { notificationPreferences, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { eq } from "drizzle-orm";

const auth = new Hono();

// Clerk webhook — syncs user creation/updates to our DB
auth.post("/webhook", async (c) => {
	const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
	if (!webhookSecret) {
		return c.json({ error: "Webhook secret not configured" }, 500);
	}

	const svixId = c.req.header("svix-id");
	const svixTimestamp = c.req.header("svix-timestamp");
	const svixSignature = c.req.header("svix-signature");

	if (!svixId || !svixTimestamp || !svixSignature) {
		return c.json({ error: "Missing svix headers" }, 400);
	}

	const body = await c.req.text();
	const wh = new Webhook(webhookSecret);

	let event: {
		type: string;
		data: {
			id: string;
			email_addresses: Array<{ email_address: string }>;
			first_name: string | null;
			last_name: string | null;
			image_url: string | null;
			phone_numbers: Array<{ phone_number: string }>;
			unsafe_metadata?: { role?: string; phone?: string };
		};
	};

	try {
		event = wh.verify(body, {
			"svix-id": svixId,
			"svix-timestamp": svixTimestamp,
			"svix-signature": svixSignature,
		}) as typeof event;
	} catch {
		return c.json({ error: "Invalid webhook signature" }, 400);
	}

	if (event.type === "user.created") {
		const { id, email_addresses, first_name, last_name, image_url, phone_numbers, unsafe_metadata } = event.data;
		const email = email_addresses[0]?.email_address;
		if (!email) return c.json({ error: "No email" }, 400);

		const role = unsafe_metadata?.role === "therapist" ? "therapist" : "client";
		const phone = unsafe_metadata?.phone ?? phone_numbers[0]?.phone_number ?? null;

		const [newUser] = await db
			.insert(users)
			.values({
				clerkId: id,
				email,
				firstName: first_name ?? "",
				lastName: last_name ?? "",
				phone,
				avatarUrl: image_url,
				role,
			})
			.returning({ id: users.id });

		// Create default notification preferences
		if (newUser) {
			await db.insert(notificationPreferences).values({ userId: newUser.id });
		}
	}

	if (event.type === "user.updated") {
		const { id, email_addresses, first_name, last_name, image_url } = event.data;
		const email = email_addresses[0]?.email_address;

		await db
			.update(users)
			.set({
				email: email ?? undefined,
				firstName: first_name ?? undefined,
				lastName: last_name ?? undefined,
				avatarUrl: image_url,
			})
			.where(eq(users.clerkId, id));
	}

	return c.json({ received: true });
});

// Get current user profile
auth.get("/me", authMiddleware, async (c) => {
	const authUser = c.get("user");

	const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);

	if (!user) {
		return c.json({ error: "User not found" }, 404);
	}

	return c.json(user);
});

export default auth;
