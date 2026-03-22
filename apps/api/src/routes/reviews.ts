import { createReviewSchema } from "@therapysync/shared";
import { and, avg, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { reviews, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const reviewsRouter = new Hono();

reviewsRouter.use("*", authMiddleware);

// Get reviews for a therapist
reviewsRouter.get("/therapist/:therapistId", async (c) => {
	const therapistId = c.req.param("therapistId");

	const result = await db
		.select({
			id: reviews.id,
			rating: reviews.rating,
			comment: reviews.comment,
			createdAt: reviews.createdAt,
			client: {
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
			},
		})
		.from(reviews)
		.innerJoin(users, eq(reviews.clientId, users.id))
		.where(eq(reviews.therapistId, therapistId))
		.orderBy(reviews.createdAt);

	return c.json(result);
});

// Get average rating for a therapist
reviewsRouter.get("/therapist/:therapistId/summary", async (c) => {
	const therapistId = c.req.param("therapistId");

	const [summary] = await db
		.select({
			averageRating: avg(reviews.rating),
			totalReviews: count(reviews.id),
		})
		.from(reviews)
		.where(eq(reviews.therapistId, therapistId));

	return c.json({
		averageRating: summary.averageRating ? Number.parseFloat(String(summary.averageRating)) : null,
		totalReviews: Number(summary.totalReviews),
	});
});

// Create or update a review (one per client per therapist)
reviewsRouter.post("/", async (c) => {
	const user = c.get("user");
	if (user.role !== "client") {
		return c.json({ error: "Only clients can leave reviews" }, 403);
	}

	const body = await c.req.json();
	const parsed = createReviewSchema.parse(body);

	// Check if review already exists
	const [existing] = await db
		.select()
		.from(reviews)
		.where(and(eq(reviews.therapistId, parsed.therapistId), eq(reviews.clientId, user.id)))
		.limit(1);

	if (existing) {
		// Update existing review
		const [updated] = await db
			.update(reviews)
			.set({ rating: parsed.rating, comment: parsed.comment ?? null })
			.where(eq(reviews.id, existing.id))
			.returning();
		return c.json(updated);
	}

	const [review] = await db
		.insert(reviews)
		.values({
			therapistId: parsed.therapistId,
			clientId: user.id,
			rating: parsed.rating,
			comment: parsed.comment ?? null,
		})
		.returning();

	return c.json(review, 201);
});

// Delete own review
reviewsRouter.delete("/:id", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");

	const [deleted] = await db
		.delete(reviews)
		.where(and(eq(reviews.id, id), eq(reviews.clientId, user.id)))
		.returning();

	if (!deleted) return c.json({ error: "Review not found" }, 404);
	return c.json({ deleted: true });
});

export default reviewsRouter;
