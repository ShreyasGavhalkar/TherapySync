import { createPaymentSchema, updatePaymentSchema } from "@therapysync/shared";
import { and, between, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { payments } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const paymentsRouter = new Hono();

paymentsRouter.use("*", authMiddleware);

// List payments
paymentsRouter.get("/", async (c) => {
	const user = c.get("user");
	const clientId = c.req.query("clientId");
	const status = c.req.query("status");
	const from = c.req.query("from");
	const to = c.req.query("to");

	const conditions = [];

	if (user.role === "therapist") {
		conditions.push(eq(payments.therapistId, user.id));
	} else if (user.role === "client") {
		conditions.push(eq(payments.clientId, user.id));
	}

	if (clientId) conditions.push(eq(payments.clientId, clientId));
	if (status) {
		conditions.push(
			eq(
				payments.status,
				status as "pending" | "paid" | "overdue" | "waived" | "refunded",
			),
		);
	}
	if (from && to) {
		conditions.push(between(payments.dueDate, from, to));
	}

	const result = await db
		.select()
		.from(payments)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(payments.dueDate);

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

// Update payment
paymentsRouter.patch("/:id", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");
	const body = await c.req.json();
	const parsed = updatePaymentSchema.parse(body);

	const conditions = [eq(payments.id, id)];
	if (user.role === "therapist") {
		conditions.push(eq(payments.therapistId, user.id));
	}

	// If marking as paid, set paidAt
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

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const result = await db
		.select({
			status: payments.status,
			totalCents: sql<number>`sum(${payments.amountCents})::int`,
			count: sql<number>`count(*)::int`,
		})
		.from(payments)
		.where(whereClause)
		.groupBy(payments.status);

	return c.json(result);
});

export default paymentsRouter;
