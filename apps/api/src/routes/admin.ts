import { updateUserSchema } from "@therapysync/shared";
import { count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { auditLogs, payments, sessions, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role-guard.js";

const admin = new Hono();

admin.use("*", authMiddleware, requireRole("admin"));

// List all users
admin.get("/users", async (c) => {
	const role = c.req.query("role");
	const allUsers = role
		? await db
				.select()
				.from(users)
				.where(eq(users.role, role as "admin" | "therapist" | "client"))
		: await db.select().from(users);

	return c.json(allUsers);
});

// Create a user (admin-initiated)
admin.post("/users", async (c) => {
	const body = await c.req.json();

	const [newUser] = await db
		.insert(users)
		.values({
			clerkId: body.clerkId,
			email: body.email,
			firstName: body.firstName,
			lastName: body.lastName,
			phone: body.phone ?? null,
			role: body.role ?? "client",
			timezone: body.timezone ?? "Asia/Kolkata",
		})
		.returning();

	return c.json(newUser, 201);
});

// Update/deactivate user
admin.patch("/users/:id", async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json();
	const parsed = updateUserSchema.parse(body);

	const [updated] = await db.update(users).set(parsed).where(eq(users.id, id)).returning();

	if (!updated) {
		return c.json({ error: "User not found" }, 404);
	}
	return c.json(updated);
});

// View audit logs
admin.get("/audit-logs", async (c) => {
	const page = Number(c.req.query("page") ?? "1");
	const limit = Math.min(Number(c.req.query("limit") ?? "50"), 100);
	const offset = (page - 1) * limit;

	const logs = await db
		.select()
		.from(auditLogs)
		.orderBy(auditLogs.createdAt)
		.limit(limit)
		.offset(offset);

	return c.json({ data: logs, page, limit });
});

// System-wide stats
admin.get("/stats", async (c) => {
	const [userCount] = await db.select({ count: count() }).from(users);
	const [sessionCount] = await db.select({ count: count() }).from(sessions);
	const [paymentCount] = await db.select({ count: count() }).from(payments);

	return c.json({
		totalUsers: userCount?.count ?? 0,
		totalSessions: sessionCount?.count ?? 0,
		totalPayments: paymentCount?.count ?? 0,
	});
});

export default admin;
