import {
	createHomeworkSchema,
	createSubmissionSchema,
	updateHomeworkSchema,
} from "@therapysync/shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { homeworkAssignments, homeworkFiles, homeworkSubmissions } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const homework = new Hono();

homework.use("*", authMiddleware);

// List homework (filtered by clientId, status)
homework.get("/", async (c) => {
	const user = c.get("user");
	const clientId = c.req.query("clientId");
	const status = c.req.query("status");

	const conditions = [];

	if (user.role === "therapist") {
		conditions.push(eq(homeworkAssignments.therapistId, user.id));
	} else if (user.role === "client") {
		conditions.push(eq(homeworkAssignments.clientId, user.id));
	}

	if (clientId) conditions.push(eq(homeworkAssignments.clientId, clientId));
	if (status) {
		conditions.push(
			eq(
				homeworkAssignments.status,
				status as "assigned" | "in_progress" | "submitted" | "reviewed" | "overdue",
			),
		);
	}

	const result = await db
		.select()
		.from(homeworkAssignments)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(homeworkAssignments.dueDate);

	return c.json(result);
});

// Create assignment
homework.post("/", async (c) => {
	const user = c.get("user");
	if (user.role === "client") {
		return c.json({ error: "Clients cannot create assignments" }, 403);
	}

	const body = await c.req.json();
	const parsed = createHomeworkSchema.parse(body);
	const therapistId = user.role === "therapist" ? user.id : parsed.therapistId;

	const [assignment] = await db
		.insert(homeworkAssignments)
		.values({
			...parsed,
			therapistId,
			status: "assigned",
			dueDate: parsed.dueDate.toISOString().split("T")[0],
		})
		.returning();

	return c.json(assignment, 201);
});

// Get assignment detail + submissions
homework.get("/:id", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");

	const [assignment] = await db
		.select()
		.from(homeworkAssignments)
		.where(eq(homeworkAssignments.id, id))
		.limit(1);

	if (!assignment) return c.json({ error: "Assignment not found" }, 404);

	if (
		user.role !== "admin" &&
		assignment.therapistId !== user.id &&
		assignment.clientId !== user.id
	) {
		return c.json({ error: "Forbidden" }, 403);
	}

	const submissions = await db
		.select()
		.from(homeworkSubmissions)
		.where(eq(homeworkSubmissions.assignmentId, id));

	const files = await db
		.select()
		.from(homeworkFiles)
		.where(eq(homeworkFiles.assignmentId, id));

	return c.json({ ...assignment, submissions, files });
});

// Update assignment
homework.patch("/:id", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");
	const body = await c.req.json();
	const parsed = updateHomeworkSchema.parse(body);

	const conditions = [eq(homeworkAssignments.id, id)];
	if (user.role === "therapist") {
		conditions.push(eq(homeworkAssignments.therapistId, user.id));
	}

	const updates: Record<string, unknown> = { ...parsed };
	if (parsed.dueDate) {
		updates.dueDate = parsed.dueDate.toISOString().split("T")[0];
	}

	const [updated] = await db
		.update(homeworkAssignments)
		.set(updates)
		.where(and(...conditions))
		.returning();

	if (!updated) return c.json({ error: "Assignment not found" }, 404);
	return c.json(updated);
});

// Submit homework (client)
homework.post("/:id/submissions", async (c) => {
	const user = c.get("user");
	const id = c.req.param("id");
	const body = await c.req.json();
	const parsed = createSubmissionSchema.parse(body);

	const [submission] = await db
		.insert(homeworkSubmissions)
		.values({
			assignmentId: id,
			submittedBy: user.id,
			content: parsed.content,
		})
		.returning();

	// Update assignment status to submitted
	await db
		.update(homeworkAssignments)
		.set({ status: "submitted" })
		.where(eq(homeworkAssignments.id, id));

	return c.json(submission, 201);
});

export default homework;
