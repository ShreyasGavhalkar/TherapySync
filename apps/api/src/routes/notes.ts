import { createSessionNoteSchema, updateSessionNoteSchema } from "@therapysync/shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { sessionNotes, sessions } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role-guard.js";

const notes = new Hono();

notes.use("*", authMiddleware, requireRole("therapist", "admin"));

// Get notes for a session
notes.get("/:sessionId/notes", async (c) => {
	const user = c.get("user");
	const sessionId = c.req.param("sessionId");

	// Verify session belongs to therapist
	if (user.role === "therapist") {
		const [session] = await db
			.select()
			.from(sessions)
			.where(and(eq(sessions.id, sessionId), eq(sessions.therapistId, user.id)))
			.limit(1);
		if (!session) return c.json({ error: "Session not found" }, 404);
	}

	const [note] = await db
		.select()
		.from(sessionNotes)
		.where(eq(sessionNotes.sessionId, sessionId))
		.limit(1);

	return c.json(note ?? null);
});

// Create note
notes.post("/:sessionId/notes", async (c) => {
	const user = c.get("user");
	const sessionId = c.req.param("sessionId");
	const body = await c.req.json();
	const parsed = createSessionNoteSchema.parse(body);

	const [note] = await db
		.insert(sessionNotes)
		.values({
			sessionId,
			therapistId: user.id,
			content: parsed.content,
		})
		.returning();

	return c.json(note, 201);
});

// Update note (only if unsigned)
notes.patch("/:sessionId/notes", async (c) => {
	const user = c.get("user");
	const sessionId = c.req.param("sessionId");
	const body = await c.req.json();
	const parsed = updateSessionNoteSchema.parse(body);

	const [updated] = await db
		.update(sessionNotes)
		.set({ content: parsed.content })
		.where(
			and(
				eq(sessionNotes.sessionId, sessionId),
				eq(sessionNotes.therapistId, user.id),
				eq(sessionNotes.isSigned, false),
			),
		)
		.returning();

	if (!updated) {
		return c.json({ error: "Note not found or already signed" }, 404);
	}
	return c.json(updated);
});

// Sign/lock note
notes.post("/:sessionId/notes/sign", async (c) => {
	const user = c.get("user");
	const sessionId = c.req.param("sessionId");

	const [signed] = await db
		.update(sessionNotes)
		.set({ isSigned: true, signedAt: new Date() })
		.where(
			and(
				eq(sessionNotes.sessionId, sessionId),
				eq(sessionNotes.therapistId, user.id),
				eq(sessionNotes.isSigned, false),
			),
		)
		.returning();

	if (!signed) {
		return c.json({ error: "Note not found or already signed" }, 404);
	}
	return c.json(signed);
});

export default notes;
