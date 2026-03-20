import { eq, and } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { pushTokensTable } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const pushTokensRouter = new Hono();

pushTokensRouter.use("*", authMiddleware);

// Register push token
pushTokensRouter.post("/", async (c) => {
	const user = c.get("user");
	const { token } = await c.req.json();

	if (!token || typeof token !== "string") {
		return c.json({ error: "token is required" }, 400);
	}

	// Upsert — ignore conflict if token already registered for this user
	await db
		.insert(pushTokensTable)
		.values({ userId: user.id, token })
		.onConflictDoNothing();

	return c.json({ registered: true });
});

// Remove push token (on sign out)
pushTokensRouter.delete("/", async (c) => {
	const user = c.get("user");
	const { token } = await c.req.json();

	if (!token) {
		return c.json({ error: "token is required" }, 400);
	}

	await db
		.delete(pushTokensTable)
		.where(and(eq(pushTokensTable.userId, user.id), eq(pushTokensTable.token, token)));

	return c.json({ removed: true });
});

export default pushTokensRouter;
