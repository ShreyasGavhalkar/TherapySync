import { cancelSessionSchema, createSessionSchema, updateSessionSchema } from "@therapysync/shared";
import { and, between, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { sessionCreatedEmail, sessionCancelledEmail } from "../lib/email.js";
import { notifySessionParticipants } from "../lib/notifications.js";
import { authMiddleware } from "../middleware/auth.js";

const sessionsRouter = new Hono();

sessionsRouter.use("*", authMiddleware);

// Helper to get user name
async function getUserName(userId: string) {
	const [u] = await db
		.select({ firstName: users.firstName, lastName: users.lastName })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return u ? `${u.firstName} ${u.lastName}` : "Unknown";
}

// List sessions (filtered by date range, status, clientId)
sessionsRouter.get("/", async (c) => {
	const user = c.get("user");
	const from = c.req.query("from");
	const to = c.req.query("to");
	const status = c.req.query("status");
	const clientId = c.req.query("clientId");

	const conditions = [];

	if (user.role === "therapist") {
		conditions.push(eq(sessions.therapistId, user.id));
	} else if (user.role === "client") {
		conditions.push(eq(sessions.clientId, user.id));
	}

	if (from && to) {
		conditions.push(between(sessions.startTime, new Date(from), new Date(to)));
	}
	if (status) {
		conditions.push(
			eq(
				sessions.status,
				status as "pending" | "confirmed" | "cancelled" | "completed" | "no_show",
			),
		);
	}
	if (clientId) {
		conditions.push(eq(sessions.clientId, clientId));
	}

	const result = await db
		.select()
		.from(sessions)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(sessions.startTime);

	return c.json(result);
});

// Create session
sessionsRouter.post("/", async (c) => {
	const user = c.get("user");
	const body = await c.req.json();
	const parsed = createSessionSchema.parse(body);

	if (user.role === "client") {
		return c.json({ error: "Clients cannot create sessions" }, 403);
	}

	const therapistId = user.role === "therapist" ? user.id : parsed.therapistId;

	const [session] = await db
		.insert(sessions)
		.values({ ...parsed, therapistId })
		.returning();

	// Notify client about new session (fire-and-forget)
	const therapistName = await getUserName(therapistId);
	const clientName = await getUserName(session.clientId);
	const email = sessionCreatedEmail({
		clientName,
		therapistName,
		title: session.title,
		startTime: session.startTime,
		location: session.location,
	});

	notifySessionParticipants({
		therapistId: session.therapistId,
		clientId: session.clientId,
		excludeUserId: user.id,
		title: "New Session Scheduled",
		body: `${session.title} on ${session.startTime.toLocaleDateString()}`,
		emailSubject: email.subject,
		emailHtml: email.html,
		data: { type: "session_created", sessionId: session.id },
	}).catch(console.error);

	return c.json(session, 201);
});

// Get session detail
sessionsRouter.get("/:id", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");

	const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);

	if (!session) {
		return c.json({ error: "Session not found" }, 404);
	}

	if (
		user.role !== "admin" &&
		session.therapistId !== user.id &&
		session.clientId !== user.id
	) {
		return c.json({ error: "Forbidden" }, 403);
	}

	const [therapist] = await db
		.select({
			id: users.id,
			firstName: users.firstName,
			lastName: users.lastName,
			email: users.email,
		})
		.from(users)
		.where(eq(users.id, session.therapistId));
	const [client] = await db
		.select({
			id: users.id,
			firstName: users.firstName,
			lastName: users.lastName,
			email: users.email,
		})
		.from(users)
		.where(eq(users.id, session.clientId));

	return c.json({ ...session, therapist, client });
});

// Update session (reschedule)
sessionsRouter.patch("/:id", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");
	const body = await c.req.json();
	const parsed = updateSessionSchema.parse(body);

	const conditions = [eq(sessions.id, id)];
	if (user.role === "therapist") {
		conditions.push(eq(sessions.therapistId, user.id));
	}

	const [updated] = await db
		.update(sessions)
		.set(parsed)
		.where(and(...conditions))
		.returning();

	if (!updated) {
		return c.json({ error: "Session not found" }, 404);
	}

	// Notify about reschedule if time changed
	if (parsed.startTime || parsed.endTime) {
		notifySessionParticipants({
			therapistId: updated.therapistId,
			clientId: updated.clientId,
			excludeUserId: user.id,
			title: "Session Rescheduled",
			body: `${updated.title} has been rescheduled to ${updated.startTime.toLocaleDateString()}`,
			data: { type: "session_rescheduled", sessionId: updated.id },
		}).catch(console.error);
	}

	return c.json(updated);
});

// Confirm session
sessionsRouter.post("/:id/confirm", async (c) => {
	const id = c.req.param("id");
	const user = c.get("user");

	const [updated] = await db
		.update(sessions)
		.set({ status: "confirmed" })
		.where(
			and(
				eq(sessions.id, id),
				eq(sessions.status, "pending"),
				user.role === "client" ? eq(sessions.clientId, user.id) : undefined,
			),
		)
		.returning();

	if (!updated) {
		return c.json({ error: "Session not found or already confirmed" }, 404);
	}

	// Notify the other participant
	notifySessionParticipants({
		therapistId: updated.therapistId,
		clientId: updated.clientId,
		excludeUserId: user.id,
		title: "Session Confirmed",
		body: `${updated.title} on ${updated.startTime.toLocaleDateString()} has been confirmed`,
		data: { type: "session_confirmed", sessionId: updated.id },
	}).catch(console.error);

	return c.json(updated);
});

// Cancel session
sessionsRouter.post("/:id/cancel", async (c) => {
	const id = c.req.param("id");
	const user = c.get("user");
	const body = await c.req.json().catch(() => ({}));
	const parsed = cancelSessionSchema.parse(body);

	const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);

	if (!session) {
		return c.json({ error: "Session not found" }, 404);
	}

	if (
		user.role !== "admin" &&
		session.therapistId !== user.id &&
		session.clientId !== user.id
	) {
		return c.json({ error: "Forbidden" }, 403);
	}

	const [updated] = await db
		.update(sessions)
		.set({
			status: "cancelled",
			cancelledBy: user.id,
			cancelReason: parsed.reason ?? null,
		})
		.where(eq(sessions.id, id))
		.returning();

	// Notify the other participant about cancellation
	const cancellerName = await getUserName(user.id);
	const otherUserId =
		user.id === session.therapistId ? session.clientId : session.therapistId;
	const otherName = await getUserName(otherUserId);
	const email = sessionCancelledEmail({
		recipientName: otherName,
		cancelledByName: cancellerName,
		title: session.title,
		startTime: session.startTime,
		reason: parsed.reason ?? null,
	});

	notifySessionParticipants({
		therapistId: session.therapistId,
		clientId: session.clientId,
		excludeUserId: user.id,
		title: "Session Cancelled",
		body: `${session.title} has been cancelled${parsed.reason ? `: ${parsed.reason}` : ""}`,
		emailSubject: email.subject,
		emailHtml: email.html,
		data: { type: "session_cancelled", sessionId: session.id },
	}).catch(console.error);

	return c.json(updated);
});

export default sessionsRouter;
