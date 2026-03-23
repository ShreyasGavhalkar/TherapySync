import { createPaymentSchema, updatePaymentSchema } from "@therapysync/shared";
import { and, between, desc, eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { payments, sessions, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const paymentsRouter = new Hono();

paymentsRouter.use("*", authMiddleware);

// List payments (with limit, client filter, and client name join)
paymentsRouter.get("/", async (c) => {
	const user = c.get("user");
	const clientIdParam = c.req.query("clientId");
	const status = c.req.query("status");
	const limit = Number(c.req.query("limit") || "10");

	const conditions = [];

	if (user.role === "therapist") {
		conditions.push(eq(payments.therapistId, user.id));
	} else if (user.role === "client") {
		conditions.push(eq(payments.clientId, user.id));
	}

	// Support comma-separated client IDs for multi-filter
	if (clientIdParam) {
		const clientIds = clientIdParam.split(",").map((s) => s.trim()).filter(Boolean);
		if (clientIds.length === 1) {
			conditions.push(eq(payments.clientId, clientIds[0]));
		} else if (clientIds.length > 1) {
			conditions.push(inArray(payments.clientId, clientIds));
		}
	}
	if (status) {
		conditions.push(
			eq(payments.status, status as "pending" | "paid" | "overdue" | "waived" | "refunded"),
		);
	}

	const result = await db
		.select({
			id: payments.id,
			therapistId: payments.therapistId,
			clientId: payments.clientId,
			sessionId: payments.sessionId,
			amountCents: payments.amountCents,
			currency: payments.currency,
			status: payments.status,
			dueDate: payments.dueDate,
			paidAt: payments.paidAt,
			paymentMethod: payments.paymentMethod,
			notes: payments.notes,
			createdAt: payments.createdAt,
			clientName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
			sessionTitle: sessions.title,
		})
		.from(payments)
		.leftJoin(users, eq(payments.clientId, users.id))
		.leftJoin(sessions, eq(payments.sessionId, sessions.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(payments.createdAt))
		.limit(limit);

	return c.json(result);
});

// Create payment record
paymentsRouter.post("/", async (c) => {
	const user = c.get("user");
	if (user.role === "client") {
		return c.json({ error: "Clients cannot create payment records" }, 403);
	}

	const body = await c.req.json();
	const parsed = createPaymentSchema.parse(body);
	const therapistId = user.role === "therapist" ? user.id : parsed.therapistId;

	const [payment] = await db
		.insert(payments)
		.values({
			...parsed,
			therapistId,
			dueDate: parsed.dueDate.toISOString().split("T")[0],
		})
		.returning();

	return c.json(payment, 201);
});

// Mark payment as paid (therapist only)
paymentsRouter.post("/:id/mark-paid", async (c) => {
	const user = c.get("user");
	if (user.role === "client") {
		return c.json({ error: "Only therapists can mark payments" }, 403);
	}

	const id = c.req.param("id");
	const body = await c.req.json();
	const { amountCents, paymentMethod } = body;

	if (!amountCents || amountCents <= 0) {
		return c.json({ error: "Amount is required" }, 400);
	}

	const conditions = [eq(payments.id, id)];
	if (user.role === "therapist") {
		conditions.push(eq(payments.therapistId, user.id));
	}

	const [updated] = await db
		.update(payments)
		.set({
			status: "paid",
			amountCents,
			paidAt: new Date(),
			paymentMethod: paymentMethod ?? null,
		})
		.where(and(...conditions))
		.returning();

	if (!updated) return c.json({ error: "Payment not found" }, 404);
	return c.json(updated);
});

// Update payment
paymentsRouter.patch("/:id", async (c) => {
	const user = c.get("user");
	if (user.role === "client") {
		return c.json({ error: "Only therapists can update payments" }, 403);
	}

	const id = c.req.param("id");
	const body = await c.req.json();
	const parsed = updatePaymentSchema.parse(body);

	const conditions = [eq(payments.id, id)];
	if (user.role === "therapist") {
		conditions.push(eq(payments.therapistId, user.id));
	}

	const updates: Record<string, unknown> = { ...parsed };
	if (parsed.dueDate) {
		updates.dueDate = parsed.dueDate.toISOString().split("T")[0];
	}
	if (parsed.status === "paid") {
		updates.paidAt = new Date();
	}

	const [updated] = await db
		.update(payments)
		.set(updates)
		.where(and(...conditions))
		.returning();

	if (!updated) return c.json({ error: "Payment not found" }, 404);
	return c.json(updated);
});

// Payment summary (aggregates)
paymentsRouter.get("/summary", async (c) => {
	const user = c.get("user");

	const conditions = [];
	if (user.role === "therapist") {
		conditions.push(eq(payments.therapistId, user.id));
	} else if (user.role === "client") {
		conditions.push(eq(payments.clientId, user.id));
	}

	const result = await db
		.select({
			status: payments.status,
			totalCents: sql<number>`sum(${payments.amountCents})::int`,
			count: sql<number>`count(*)::int`,
		})
		.from(payments)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.groupBy(payments.status);

	return c.json(result);
});

export default paymentsRouter;
