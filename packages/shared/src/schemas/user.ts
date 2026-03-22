import { z } from "zod";
import { USER_ROLES } from "../constants.js";

export const userSchema = z.object({
	id: z.string().uuid(),
	clerkId: z.string(),
	email: z.string().email(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	phone: z.string().nullable(),
	role: z.enum(USER_ROLES),
	avatarUrl: z.string().url().nullable(),
	timezone: z.string().default("Asia/Kolkata"),
	isActive: z.boolean().default(true),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createUserSchema = userSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateUserSchema = userSchema
	.pick({
		firstName: true,
		lastName: true,
		phone: true,
		avatarUrl: true,
		timezone: true,
		isActive: true,
		role: true,
	})
	.partial();

export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
