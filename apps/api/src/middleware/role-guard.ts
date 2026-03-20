import type { UserRole } from "@therapysync/shared";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export const requireRole = (...roles: UserRole[]) =>
	createMiddleware(async (c: Context, next: Next) => {
		const user = c.get("user");
		if (!user || !roles.includes(user.role)) {
			throw new HTTPException(403, { message: "Insufficient permissions" });
		}
		await next();
	});
