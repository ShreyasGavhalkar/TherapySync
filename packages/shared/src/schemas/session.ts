import { z } from "zod";
import { SESSION_STATUSES } from "../constants.js";

export const sessionSchema = z.object({
	id: z.string().uuid(),
	therapistId: z.string().uuid(),
	clientId: z.string().uuid(),
	title: z.string().min(1),
	startTime: z.coerce.date(),
	endTime: z.coerce.date(),
	status: z.enum(SESSION_STATUSES),
	location: z.string().nullable(),
	recurrenceRule: z.string().nullable(),
	cancelledBy: z.string().uuid().nullable(),
	cancelReason: z.string().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createSessionSchema = sessionSchema
	.omit({
		id: true,
		cancelledBy: true,
		cancelReason: true,
		createdAt: true,
		updatedAt: true,
	})
	.extend({
		therapistId: z.string().default(""),
		status: z.enum(SESSION_STATUSES).default("pending"),
	});

export const updateSessionSchema = sessionSchema
	.pick({
		title: true,
		startTime: true,
		endTime: true,
		status: true,
		location: true,
		recurrenceRule: true,
	})
	.partial();

export const cancelSessionSchema = z.object({
	reason: z.string().optional(),
});

export type Session = z.infer<typeof sessionSchema>;
export type CreateSession = z.infer<typeof createSessionSchema>;
export type UpdateSession = z.infer<typeof updateSessionSchema>;
