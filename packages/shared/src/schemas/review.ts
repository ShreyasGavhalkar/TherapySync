import { z } from "zod";

export const reviewSchema = z.object({
	id: z.string().uuid(),
	therapistId: z.string().uuid(),
	clientId: z.string().uuid(),
	rating: z.number().int().min(1).max(5),
	comment: z.string().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createReviewSchema = z.object({
	therapistId: z.string().uuid(),
	rating: z.number().int().min(1).max(5),
	comment: z.string().optional(),
});

export const updateReviewSchema = z.object({
	rating: z.number().int().min(1).max(5).optional(),
	comment: z.string().optional(),
});

export type Review = z.infer<typeof reviewSchema>;
export type CreateReview = z.infer<typeof createReviewSchema>;
