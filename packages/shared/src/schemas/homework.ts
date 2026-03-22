import { z } from "zod";
import { HOMEWORK_STATUSES } from "../constants.js";

export const homeworkAssignmentSchema = z.object({
	id: z.string().uuid(),
	therapistId: z.string().uuid(),
	clientId: z.string().uuid(),
	sessionId: z.string().uuid().nullable(),
	title: z.string().min(1),
	description: z.string(),
	dueDate: z.coerce.date(),
	status: z.enum(HOMEWORK_STATUSES),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createHomeworkSchema = homeworkAssignmentSchema.omit({
	id: true,
	status: true,
	createdAt: true,
	updatedAt: true,
});

export const updateHomeworkSchema = homeworkAssignmentSchema
	.pick({
		title: true,
		description: true,
		dueDate: true,
		status: true,
	})
	.partial();

export const homeworkSubmissionSchema = z.object({
	id: z.string().uuid(),
	assignmentId: z.string().uuid(),
	submittedBy: z.string().uuid(),
	content: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createSubmissionSchema = z.object({
	content: z.string().min(1),
});

export const homeworkFileSchema = z.object({
	id: z.string().uuid(),
	submissionId: z.string().uuid().nullable(),
	assignmentId: z.string().uuid().nullable(),
	uploadedBy: z.string().uuid(),
	fileName: z.string(),
	fileUrl: z.string(),
	fileSize: z.number().int().positive(),
	mimeType: z.string(),
	createdAt: z.coerce.date(),
});

export type HomeworkAssignment = z.infer<typeof homeworkAssignmentSchema>;
export type CreateHomework = z.infer<typeof createHomeworkSchema>;
export type HomeworkSubmission = z.infer<typeof homeworkSubmissionSchema>;
export type CreateSubmission = z.infer<typeof createSubmissionSchema>;
export type HomeworkFile = z.infer<typeof homeworkFileSchema>;
