import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { homeworkFiles } from "../db/schema.js";
import { eq } from "drizzle-orm";

const files = new Hono();
const UPLOADS_DIR = join(process.cwd(), "uploads");

files.use("*", authMiddleware);

// Upload file (multipart form data)
files.post("/upload", async (c) => {
	const user = c.get("user");
	const formData = await c.req.formData();
	const file = formData.get("file") as File | null;
	const assignmentId = formData.get("assignmentId") as string | null;
	const submissionId = formData.get("submissionId") as string | null;

	if (!file) {
		return c.json({ error: "No file provided" }, 400);
	}

	// Create uploads directory
	const userDir = join(UPLOADS_DIR, user.id);
	await mkdir(userDir, { recursive: true });

	// Write file to disk
	const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
	const filePath = join(userDir, safeName);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(filePath, buffer);

	// Store file record in DB
	const fileUrl = `/api/v1/files/${user.id}/${safeName}`;
	const [record] = await db
		.insert(homeworkFiles)
		.values({
			uploadedBy: user.id,
			fileName: file.name,
			fileUrl,
			fileSize: file.size,
			mimeType: file.type || "application/octet-stream",
			assignmentId: assignmentId || null,
			submissionId: submissionId || null,
		})
		.returning();

	return c.json(record, 201);
});

// Download / serve file
files.get("/:userId/:fileName", async (c) => {
	const { userId, fileName } = c.req.param();
	const filePath = join(UPLOADS_DIR, userId, fileName);

	if (!existsSync(filePath)) {
		return c.json({ error: "File not found" }, 404);
	}

	const file = Bun.file(filePath);
	return new Response(file.stream(), {
		headers: {
			"Content-Type": file.type || "application/octet-stream",
			"Content-Disposition": `inline; filename="${fileName}"`,
		},
	});
});

// List files for an assignment
files.get("/assignment/:assignmentId", async (c) => {
	const assignmentId = c.req.param("assignmentId");
	const result = await db
		.select()
		.from(homeworkFiles)
		.where(eq(homeworkFiles.assignmentId, assignmentId));

	return c.json(result);
});

// Delete file
files.delete("/:fileId", async (c) => {
	const user = c.get("user");
	const fileId = c.req.param("fileId");

	const [file] = await db
		.select()
		.from(homeworkFiles)
		.where(eq(homeworkFiles.id, fileId))
		.limit(1);

	if (!file) return c.json({ error: "File not found" }, 404);
	if (file.uploadedBy !== user.id && user.role !== "admin") {
		return c.json({ error: "Forbidden" }, 403);
	}

	// Delete from disk
	const filePath = join(UPLOADS_DIR, user.id, file.fileUrl.split("/").pop() ?? "");
	const { unlink } = await import("node:fs/promises");
	await unlink(filePath).catch(() => {});

	// Delete DB record
	await db.delete(homeworkFiles).where(eq(homeworkFiles.id, fileId));

	return c.json({ deleted: true });
});

export default files;
