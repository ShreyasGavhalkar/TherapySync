import { z } from "zod";

export const sessionNoteSchema = z.object({
	id: z.string().uuid(),
	sessionId: z.string().uuid(),
	therapistId: z.string().uuid(),
	content: z.string(),
	isSigned: z.boolean().default(false),
	signedAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createSessionNoteSchema = z.object({
	content: z.string().min(1),
});

export const updateSessionNoteSchema = z.object({
	content: z.string().min(1),
});

export type SessionNote = z.infer<typeof sessionNoteSchema>;
export type CreateSessionNote = z.infer<typeof createSessionNoteSchema>;
export type UpdateSessionNote = z.infer<typeof updateSessionNoteSchema>;
