import { z } from "zod";
import { CLIENT_STATUSES } from "../constants.js";

export const therapistClientSchema = z.object({
	id: z.string().uuid(),
	therapistId: z.string().uuid(),
	clientId: z.string().uuid(),
	status: z.enum(CLIENT_STATUSES),
	startedAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const inviteClientSchema = z.object({
	email: z.string().email(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
});

export const updateClientRelationshipSchema = z.object({
	status: z.enum(CLIENT_STATUSES),
});

export type TherapistClient = z.infer<typeof therapistClientSchema>;
export type InviteClient = z.infer<typeof inviteClientSchema>;
