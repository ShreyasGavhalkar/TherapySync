import { createClerkClient, verifyToken } from "@clerk/backend";
import type { UserRole } from "@therapysync/shared";
import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { db } from "../db/index.js";
import { notificationPreferences, users } from "../db/schema.js";

type AuthUser = {
	id: string;
	clerkId: string;
	email: string;
	role: UserRole;
};

declare module "hono" {
	interface ContextVariableMap {
		user: AuthUser;
	}
}

export const authMiddleware = createMiddleware(async (c: Context, next: Next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		throw new HTTPException(401, { message: "Missing authorization token" });
	}

	const token = authHeader.slice(7);
	const secretKey = process.env.CLERK_SECRET_KEY;
	if (!secretKey) {
		throw new HTTPException(500, { message: "Server misconfigured" });
	}

	let payload: { sub: string };
	try {
		payload = await verifyToken(token, { secretKey });
	} catch (error) {
		console.error("Token verification failed:", error);
		throw new HTTPException(401, { message: "Invalid token" });
	}

	// Look up by clerk_id
	let [user] = await db
		.select({
			id: users.id,
			clerkId: users.clerkId,
			email: users.email,
			role: users.role,
		})
		.from(users)
		.where(eq(users.clerkId, payload.sub))
		.limit(1);

	if (!user) {
		// Auto-provision user from Clerk
		try {
			const clerk = createClerkClient({ secretKey });
			const clerkUser = await clerk.users.getUser(payload.sub);
			const email = clerkUser.emailAddresses[0]?.emailAddress;
			if (!email) {
				throw new HTTPException(400, { message: "No email on Clerk account" });
			}

			const metadata = clerkUser.unsafeMetadata as { role?: string; phone?: string; address?: string; certification?: string } | undefined;
			const role = metadata?.role === "therapist" ? "therapist" : "client";
			const phone = metadata?.phone ?? clerkUser.phoneNumbers[0]?.phoneNumber ?? null;

			// Upsert: insert or update on clerk_id OR email conflict
			const [upserted] = await db
				.insert(users)
				.values({
					clerkId: clerkUser.id,
					email,
					firstName: clerkUser.firstName ?? "",
					lastName: clerkUser.lastName ?? "",
					phone,
					avatarUrl: clerkUser.imageUrl,
					role,
					city: metadata?.address ?? null,
					specializations: metadata?.certification ?? null,
				})
				.onConflictDoUpdate({
					target: users.clerkId,
					set: {
						email,
						firstName: clerkUser.firstName ?? "",
						lastName: clerkUser.lastName ?? "",
						phone,
						avatarUrl: clerkUser.imageUrl,
					},
				})
				.returning({ id: users.id, clerkId: users.clerkId, email: users.email, role: users.role });

			if (!upserted) {
				// If clerk_id didn't conflict, maybe email did — try updating by email
				const [byEmail] = await db
					.update(users)
					.set({ clerkId: clerkUser.id, firstName: clerkUser.firstName ?? "", lastName: clerkUser.lastName ?? "", phone, avatarUrl: clerkUser.imageUrl })
					.where(eq(users.email, email))
					.returning({ id: users.id, clerkId: users.clerkId, email: users.email, role: users.role });
				user = byEmail;
			} else {
				user = upserted;
			}

			// Ensure notification preferences exist
			if (user) {
				await db.insert(notificationPreferences).values({ userId: user.id }).onConflictDoNothing();
			}

			console.log(`Auto-provisioned user ${email} as ${role}`);
		} catch (error) {
			if (error instanceof HTTPException) throw error;
			console.error("Auto-provision failed:", error);
			throw new HTTPException(500, { message: "Failed to provision user" });
		}
	}

	c.set("user", user);
	await next();
});
