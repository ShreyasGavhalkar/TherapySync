import { z } from "zod";
import { AUDIT_ACTIONS } from "../constants.js";

export const auditLogSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	action: z.enum(AUDIT_ACTIONS),
	resourceType: z.string(),
	resourceId: z.string().uuid(),
	metadata: z.record(z.unknown()).nullable(),
	createdAt: z.coerce.date(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;
