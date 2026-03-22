import { inviteClientSchema } from "@therapysync/shared";
import { and, desc, eq, or } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { payments, sessionNotes, sessions, therapistClients, users } from "../db/schema.js";
import { sendEmail } from "../lib/email.js";
import { notifyUser } from "../lib/notifications.js";
import { authMiddleware } from "../middleware/auth.js";

const clients = new Hono();

clients.use("*", authMiddleware);

// List relationships for current user (works for both therapists and clients)
clients.get("/", async (c) => {
	const user = c.get("user");

	if (user.role === "therapist" || user.role === "admin") {
		// Therapist sees their clients
		const result = await db
			.select({
				id: therapistClients.id,
				status: therapistClients.status,
				initiatedBy: therapistClients.initiatedBy,
				startedAt: therapistClients.startedAt,
				client: {
					id: users.id,
					email: users.email,
					firstName: users.firstName,
					lastName: users.lastName,
					phone: users.phone,
					avatarUrl: users.avatarUrl,
				},
			})
			.from(therapistClients)
			.innerJoin(users, eq(therapistClients.clientId, users.id))
			.where(eq(therapistClients.therapistId, user.id));
		return c.json(result);
	}

	// Client sees their therapists
	const result = await db
		.select({
			id: therapistClients.id,
			status: therapistClients.status,
			initiatedBy: therapistClients.initiatedBy,
			startedAt: therapistClients.startedAt,
			therapist: {
				id: users.id,
				email: users.email,
				firstName: users.firstName,
				lastName: users.lastName,
				phone: users.phone,
				avatarUrl: users.avatarUrl,
			},
		})
		.from(therapistClients)
		.innerJoin(users, eq(therapistClients.therapistId, users.id))
		.where(eq(therapistClients.clientId, user.id));
	return c.json(result);
});

// Therapist invites client by email
clients.post("/invite", async (c) => {
	const user = c.get("user");
	if (user.role === "client") {
		return c.json({ error: "Clients cannot invite" }, 403);
	}

	const body = await c.req.json();
	const parsed = inviteClientSchema.parse(body);

	// Check if client exists on the platform
	let [client] = await db
		.select()
		.from(users)
		.where(eq(users.email, parsed.email))
		.limit(1);

	const existsOnPlatform = !!client;

	if (!client) {
		// Create placeholder user — will be linked when they sign up
		[client] = await db
			.insert(users)
			.values({
				clerkId: `pending_${Date.now()}`,
				email: parsed.email,
				firstName: parsed.firstName,
				lastName: parsed.lastName,
				role: "client",
				isActive: false,
			})
			.returning();
	}

	// Check for existing relationship
	const [existing] = await db
		.select()
		.from(therapistClients)
		.where(and(eq(therapistClients.therapistId, user.id), eq(therapistClients.clientId, client.id)))
		.limit(1);

	if (existing) {
		return c.json({ error: "Relationship already exists", relationship: existing }, 409);
	}

	// Create relationship — pending_invite means client needs to accept
	const [relationship] = await db
		.insert(therapistClients)
		.values({
			therapistId: user.id,
			clientId: client.id,
			status: "pending_invite",
			initiatedBy: user.id,
		})
		.returning();

	// Get therapist name for notifications
	const [therapist] = await db
		.select({ firstName: users.firstName, lastName: users.lastName })
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);
	const therapistName = therapist ? `${therapist.firstName} ${therapist.lastName}` : "A therapist";

	if (existsOnPlatform) {
		// Send in-app notification
		notifyUser({
			userId: client.id,
			title: "New Invitation",
			body: `${therapistName} has invited you to be their client`,
			data: { type: "client_invite", relationshipId: relationship.id },
		}).catch(console.error);
	} else {
		// Send email to sign up
		sendEmail({
			to: parsed.email,
			subject: `${therapistName} invited you to TherapySync`,
			html: `
				<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #6C63FF;">You're Invited to TherapySync</h2>
					<p>Hi ${parsed.firstName},</p>
					<p>${therapistName} has invited you to join TherapySync to manage your therapy sessions, homework, and payments.</p>
					<p>Sign up with this email address (<strong>${parsed.email}</strong>) to get connected automatically.</p>
				</div>
			`,
		}).catch(console.error);
	}

	return c.json(relationship, 201);
});

// Client requests services from a therapist
clients.post("/request", async (c) => {
	const user = c.get("user");
	if (user.role !== "client") {
		return c.json({ error: "Only clients can request services" }, 403);
	}

	const { therapistId } = await c.req.json();
	if (!therapistId) return c.json({ error: "therapistId is required" }, 400);

	// Verify therapist exists
	const [therapist] = await db
		.select()
		.from(users)
		.where(and(eq(users.id, therapistId), eq(users.role, "therapist")))
		.limit(1);

	if (!therapist) return c.json({ error: "Therapist not found" }, 404);

	// Check for existing relationship
	const [existing] = await db
		.select()
		.from(therapistClients)
		.where(and(eq(therapistClients.therapistId, therapistId), eq(therapistClients.clientId, user.id)))
		.limit(1);

	if (existing) {
		return c.json({ error: "Relationship already exists", relationship: existing }, 409);
	}

	// Create relationship — pending_approval means therapist needs to accept
	const [relationship] = await db
		.insert(therapistClients)
		.values({
			therapistId,
			clientId: user.id,
			status: "pending_approval",
			initiatedBy: user.id,
		})
		.returning();

	// Notify therapist
	const [client] = await db
		.select({ firstName: users.firstName, lastName: users.lastName })
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);

	notifyUser({
		userId: therapistId,
		title: "New Service Request",
		body: `${client?.firstName} ${client?.lastName} wants to be your client`,
		data: { type: "service_request", relationshipId: relationship.id },
	}).catch(console.error);

	return c.json(relationship, 201);
});

// Accept an invitation or request
clients.post("/:id/accept", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");

	const [rel] = await db
		.select()
		.from(therapistClients)
		.where(eq(therapistClients.id, id))
		.limit(1);

	if (!rel) return c.json({ error: "Not found" }, 404);

	// Only the person who DIDN'T initiate can accept
	const canAccept =
		(rel.status === "pending_invite" && rel.clientId === user.id) ||
		(rel.status === "pending_approval" && rel.therapistId === user.id);

	if (!canAccept) {
		return c.json({ error: "You cannot accept this" }, 403);
	}

	const [updated] = await db
		.update(therapistClients)
		.set({ status: "active", startedAt: new Date().toISOString().split("T")[0] })
		.where(eq(therapistClients.id, id))
		.returning();

	// Notify the initiator
	const notifyUserId = rel.initiatedBy === rel.therapistId ? rel.therapistId : rel.clientId;
	const otherUserId = notifyUserId === rel.therapistId ? rel.clientId : rel.therapistId;
	const [acceptor] = await db
		.select({ firstName: users.firstName, lastName: users.lastName })
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);

	notifyUser({
		userId: notifyUserId === user.id ? otherUserId : notifyUserId,
		title: "Invitation Accepted",
		body: `${acceptor?.firstName} ${acceptor?.lastName} accepted your request`,
		data: { type: "relationship_accepted", relationshipId: id },
	}).catch(console.error);

	return c.json(updated);
});

// Reject an invitation or request
clients.post("/:id/reject", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");

	const [rel] = await db
		.select()
		.from(therapistClients)
		.where(eq(therapistClients.id, id))
		.limit(1);

	if (!rel) return c.json({ error: "Not found" }, 404);

	const canReject =
		(rel.status === "pending_invite" && rel.clientId === user.id) ||
		(rel.status === "pending_approval" && rel.therapistId === user.id);

	if (!canReject) {
		return c.json({ error: "You cannot reject this" }, 403);
	}

	const [updated] = await db
		.update(therapistClients)
		.set({ status: "rejected" })
		.where(eq(therapistClients.id, id))
		.returning();

	return c.json(updated);
});

// Update relationship (archive, etc.) — therapist only
clients.patch("/:id", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");
	const { status } = await c.req.json();

	const conditions = [eq(therapistClients.id, id)];
	if (user.role === "therapist") {
		conditions.push(eq(therapistClients.therapistId, user.id));
	}

	const [updated] = await db
		.update(therapistClients)
		.set({ status })
		.where(and(...conditions))
		.returning();

	if (!updated) return c.json({ error: "Not found" }, 404);
	return c.json(updated);
});

// Get client detail: sessions with notes and payment status
clients.get("/detail/:clientId", async (c) => {
	const user = c.get("user");
	const clientId = c.req.param("clientId");

	// Determine therapist/client IDs based on role
	const therapistId = user.role === "client" ? clientId : user.id;
	const actualClientId = user.role === "client" ? user.id : clientId;

	// Verify relationship exists
	const [rel] = await db
		.select()
		.from(therapistClients)
		.where(and(eq(therapistClients.therapistId, therapistId), eq(therapistClients.clientId, actualClientId)))
		.limit(1);

	if (!rel) return c.json({ error: "No relationship found" }, 404);

	// Get user info
	const [person] = await db
		.select({
			id: users.id,
			email: users.email,
			firstName: users.firstName,
			lastName: users.lastName,
			phone: users.phone,
			avatarUrl: users.avatarUrl,
		})
		.from(users)
		.where(eq(users.id, user.role === "client" ? therapistId : actualClientId))
		.limit(1);

	// Get all sessions between this therapist and client
	const sessionList = await db
		.select()
		.from(sessions)
		.where(and(eq(sessions.therapistId, therapistId), eq(sessions.clientId, actualClientId)))
		.orderBy(desc(sessions.startTime));

	// Get notes and payments for each session
	const sessionDetails = await Promise.all(
		sessionList.map(async (session) => {
			const [note] = await db
				.select({ id: sessionNotes.id, isSigned: sessionNotes.isSigned })
				.from(sessionNotes)
				.where(eq(sessionNotes.sessionId, session.id))
				.limit(1);

			const [payment] = await db
				.select({
					id: payments.id,
					amountCents: payments.amountCents,
					currency: payments.currency,
					status: payments.status,
					paidAt: payments.paidAt,
				})
				.from(payments)
				.where(eq(payments.sessionId, session.id))
				.limit(1);

			return {
				...session,
				hasNote: !!note,
				noteId: note?.id ?? null,
				noteSigned: note?.isSigned ?? false,
				payment: payment ?? (session.status === "completed" ? { status: "unpaid" as const, amountCents: 0, currency: "USD" } : null),
			};
		}),
	);

	return c.json({
		person,
		relationship: rel,
		sessions: sessionDetails,
	});
});

export default clients;
