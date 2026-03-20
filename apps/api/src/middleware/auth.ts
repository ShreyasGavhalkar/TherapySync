import { verifyToken } from "@clerk/backend";
import type { UserRole } from "@therapysync/shared";
import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

type AuthUser = {
	id: string;
	clerkId: string;
	email: string;
	role: UserRole;
};

declare module "hono" {
	interface ContextVariableMap {
		user: AuthUser;
	}
}

export const authMiddleware = createMiddleware(async (c: Context, next: Next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		throw new HTTPException(401, { message: "Missing authorization token" });
	}

	const token = authHeader.slice(7);
	const secretKey = process.env.CLERK_SECRET_KEY;
	if (!secretKey) {
		throw new HTTPException(500, { message: "Server misconfigured" });
	}

	try {
		const payload = await verifyToken(token, { secretKey });

		const [user] = await db
			.select({
				id: users.id,
				clerkId: users.clerkId,
				email: users.email,
				role: users.role,
			})
			.from(users)
			.where(eq(users.clerkId, payload.sub))
			.limit(1);

		if (!user) {
			throw new HTTPException(401, { message: "User not found" });
		}

		c.set("user", user);
		await next();
	} catch (error) {
		if (error instanceof HTTPException) throw error;
		throw new HTTPException(401, { message: "Invalid token" });
	}
});
