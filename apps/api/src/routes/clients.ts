import { inviteClientSchema, updateClientRelationshipSchema } from "@therapysync/shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { therapistClients, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role-guard.js";

const clients = new Hono();

clients.use("*", authMiddleware, requireRole("therapist", "admin"));

// List therapist's clients
clients.get("/", async (c) => {
	const user = c.get("user");

	const result = await db
		.select({
			id: therapistClients.id,
			status: therapistClients.status,
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
});

// Invite client by email
clients.post("/invite", async (c) => {
	const user = c.get("user");
	const body = await c.req.json();
	const parsed = inviteClientSchema.parse(body);

	// Check if client exists
	let [client] = await db
		.select()
		.from(users)
		.where(eq(users.email, parsed.email))
		.limit(1);

	if (!client) {
		// Create a placeholder user for the invite
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

	// Create relationship
	const [relationship] = await db
		.insert(therapistClients)
		.values({
			therapistId: user.id,
			clientId: client.id,
			status: "pending_invite",
		})
		.returning();

	// TODO: Send invite email via Resend

	return c.json(relationship, 201);
});

// Update relationship (archive, etc.)
clients.patch("/:id", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");
	const body = await c.req.json();
	const parsed = updateClientRelationshipSchema.parse(body);

	const [updated] = await db
		.update(therapistClients)
		.set({ status: parsed.status })
		.where(and(eq(therapistClients.id, id), eq(therapistClients.therapistId, user.id)))
		.returning();

	if (!updated) {
		return c.json({ error: "Relationship not found" }, 404);
	}
	return c.json(updated);
});

export default clients;
