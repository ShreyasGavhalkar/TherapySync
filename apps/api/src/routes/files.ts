import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { homeworkFiles } from "../db/schema.js";

const files = new Hono();

files.use("*", authMiddleware);

// Get presigned upload URL
files.post("/upload-url", async (c) => {
	const user = c.get("user");
	const body = await c.req.json();
	const { fileName, mimeType, fileSize, assignmentId, submissionId } = body;

	// In production, this would generate a presigned URL from R2
	// For now, return a placeholder
	const key = `uploads/${user.id}/${Date.now()}-${fileName}`;

	// Store file record
	const [file] = await db
		.insert(homeworkFiles)
		.values({
			uploadedBy: user.id,
			fileName,
			fileUrl: key,
			fileSize,
			mimeType,
			assignmentId: assignmentId ?? null,
			submissionId: submissionId ?? null,
		})
		.returning();

	// TODO: Generate actual R2 presigned URL
	const uploadUrl = `https://placeholder.r2.dev/${key}`;

	return c.json({ file, uploadUrl }, 201);
});

export default files;
