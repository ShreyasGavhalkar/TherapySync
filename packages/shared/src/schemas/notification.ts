import { z } from "zod";

export const notificationPreferencesSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	pushEnabled: z.boolean().default(true),
	emailEnabled: z.boolean().default(true),
	reminderHours: z.number().int().positive().default(24),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const updateNotificationPreferencesSchema = z.object({
	pushEnabled: z.boolean().optional(),
	emailEnabled: z.boolean().optional(),
	reminderHours: z.number().int().positive().optional(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
export type UpdateNotificationPreferences = z.infer<typeof updateNotificationPreferencesSchema>;
