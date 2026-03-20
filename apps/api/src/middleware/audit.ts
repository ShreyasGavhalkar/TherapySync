import type { AuditAction } from "@therapysync/shared";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { db } from "../db/index.js";
import { auditLogs } from "../db/schema.js";

export function logAudit(action: AuditAction, resourceType: string) {
	return createMiddleware(async (c: Context, next: Next) => {
		await next();

		// Only log on successful responses
		if (c.res.status >= 200 && c.res.status < 300) {
			const user = c.get("user");
			const resourceId = c.req.param("id");

			if (user && resourceId) {
				// Fire and forget — don't block the response
				db.insert(auditLogs)
					.values({
						userId: user.id,
						action,
						resourceType,
						resourceId,
						metadata: {
							method: c.req.method,
							path: c.req.path,
							ip: c.req.header("x-forwarded-for") ?? "unknown",
						},
					})
					.catch(console.error);
			}
		}
	});
}
