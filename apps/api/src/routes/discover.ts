import { avg, count, desc, eq, and, isNotNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { reviews, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const discover = new Hono();

discover.use("*", authMiddleware);

// Browse top-rated therapists, optionally filtered by geographic proximity
discover.get("/therapists", async (c) => {
	const lat = c.req.query("lat");
	const lng = c.req.query("lng");
	const radiusKm = Number(c.req.query("radius") || "50");
	const city = c.req.query("city");

	// Base query: all active therapists with their average rating
	const therapists = await db
		.select({
			id: users.id,
			firstName: users.firstName,
			lastName: users.lastName,
			avatarUrl: users.avatarUrl,
			bio: users.bio,
			specializations: users.specializations,
			city: users.city,
			latitude: users.latitude,
			longitude: users.longitude,
			averageRating: avg(reviews.rating),
			totalReviews: count(reviews.id),
		})
		.from(users)
		.leftJoin(reviews, eq(users.id, reviews.therapistId))
		.where(and(eq(users.role, "therapist"), eq(users.isActive, true)))
		.groupBy(users.id)
		.orderBy(desc(avg(reviews.rating)));

	let filtered = therapists;

	// Filter by city name
	if (city) {
		filtered = filtered.filter(
			(t) => t.city?.toLowerCase().includes(city.toLowerCase()),
		);
	}

	// Filter by geographic distance (Haversine approximation)
	if (lat && lng) {
		const userLat = Number.parseFloat(lat);
		const userLng = Number.parseFloat(lng);

		filtered = filtered.filter((t) => {
			if (!t.latitude || !t.longitude) return false;
			const distance = haversineKm(userLat, userLng, t.latitude, t.longitude);
			return distance <= radiusKm;
		});

		// Sort by distance
		filtered.sort((a, b) => {
			const distA = haversineKm(userLat, userLng, a.latitude!, a.longitude!);
			const distB = haversineKm(userLat, userLng, b.latitude!, b.longitude!);
			return distA - distB;
		});
	}

	return c.json(
		filtered.map((t) => ({
			...t,
			averageRating: t.averageRating ? Number.parseFloat(String(t.averageRating)) : null,
			totalReviews: Number(t.totalReviews),
		})),
	);
});

// Get a single therapist's public profile
discover.get("/therapists/:id", async (c) => {
	const id = c.req.param("id");

	const [therapist] = await db
		.select({
			id: users.id,
			firstName: users.firstName,
			lastName: users.lastName,
			avatarUrl: users.avatarUrl,
			bio: users.bio,
			specializations: users.specializations,
			city: users.city,
			phone: users.phone,
		})
		.from(users)
		.where(and(eq(users.id, id), eq(users.role, "therapist")))
		.limit(1);

	if (!therapist) return c.json({ error: "Therapist not found" }, 404);

	const [ratingInfo] = await db
		.select({
			averageRating: avg(reviews.rating),
			totalReviews: count(reviews.id),
		})
		.from(reviews)
		.where(eq(reviews.therapistId, id));

	const therapistReviews = await db
		.select({
			id: reviews.id,
			rating: reviews.rating,
			comment: reviews.comment,
			createdAt: reviews.createdAt,
			client: {
				firstName: users.firstName,
				lastName: users.lastName,
			},
		})
		.from(reviews)
		.innerJoin(users, eq(reviews.clientId, users.id))
		.where(eq(reviews.therapistId, id))
		.orderBy(desc(reviews.createdAt));

	return c.json({
		...therapist,
		averageRating: ratingInfo.averageRating ? Number.parseFloat(String(ratingInfo.averageRating)) : null,
		totalReviews: Number(ratingInfo.totalReviews),
		reviews: therapistReviews,
	});
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default discover;
