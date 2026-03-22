import {
	boolean,
	date,
	doublePrecision,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "therapist", "client"]);
export const clientStatusEnum = pgEnum("client_status", ["active", "archived", "pending_invite", "pending_approval", "rejected"]);
export const sessionStatusEnum = pgEnum("session_status", [
	"pending",
	"confirmed",
	"cancelled",
	"completed",
	"no_show",
]);
export const homeworkStatusEnum = pgEnum("homework_status", [
	"assigned",
	"in_progress",
	"submitted",
	"reviewed",
	"overdue",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
	"pending",
	"paid",
	"overdue",
	"waived",
	"refunded",
]);
export const auditActionEnum = pgEnum("audit_action", ["CREATE", "READ", "UPDATE", "DELETE"]);

// Tables
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	clerkId: text("clerk_id").unique().notNull(),
	email: text("email").unique().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	phone: text("phone"),
	role: userRoleEnum("role").notNull().default("client"),
	avatarUrl: text("avatar_url"),
	bio: text("bio"),
	specializations: text("specializations"), // comma-separated
	city: text("city"),
	latitude: doublePrecision("latitude"),
	longitude: doublePrecision("longitude"),
	timezone: text("timezone").notNull().default("Asia/Kolkata"),
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const therapistClients = pgTable(
	"therapist_clients",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		therapistId: uuid("therapist_id")
			.notNull()
			.references(() => users.id),
		clientId: uuid("client_id")
			.notNull()
			.references(() => users.id),
		status: clientStatusEnum("status").notNull().default("pending_invite"),
		initiatedBy: uuid("initiated_by").references(() => users.id),
		startedAt: date("started_at"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [unique("therapist_client_unique").on(table.therapistId, table.clientId)],
);

export const sessions = pgTable("sessions", {
	id: uuid("id").primaryKey().defaultRandom(),
	therapistId: uuid("therapist_id")
		.notNull()
		.references(() => users.id),
	clientId: uuid("client_id")
		.notNull()
		.references(() => users.id),
	title: text("title").notNull(),
	startTime: timestamp("start_time", { withTimezone: true }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true }).notNull(),
	status: sessionStatusEnum("status").notNull().default("pending"),
	location: text("location"),
	recurrenceRule: text("recurrence_rule"),
	cancelledBy: uuid("cancelled_by").references(() => users.id),
	cancelReason: text("cancel_reason"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const sessionNotes = pgTable("session_notes", {
	id: uuid("id").primaryKey().defaultRandom(),
	sessionId: uuid("session_id")
		.notNull()
		.unique()
		.references(() => sessions.id),
	therapistId: uuid("therapist_id")
		.notNull()
		.references(() => users.id),
	content: text("content").notNull(),
	isSigned: boolean("is_signed").notNull().default(false),
	signedAt: timestamp("signed_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const homeworkAssignments = pgTable("homework_assignments", {
	id: uuid("id").primaryKey().defaultRandom(),
	therapistId: uuid("therapist_id")
		.notNull()
		.references(() => users.id),
	clientId: uuid("client_id")
		.notNull()
		.references(() => users.id),
	sessionId: uuid("session_id").references(() => sessions.id),
	title: text("title").notNull(),
	description: text("description").notNull(),
	dueDate: date("due_date").notNull(),
	status: homeworkStatusEnum("status").notNull().default("assigned"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const homeworkSubmissions = pgTable("homework_submissions", {
	id: uuid("id").primaryKey().defaultRandom(),
	assignmentId: uuid("assignment_id")
		.notNull()
		.references(() => homeworkAssignments.id),
	submittedBy: uuid("submitted_by")
		.notNull()
		.references(() => users.id),
	content: text("content").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const homeworkFiles = pgTable("homework_files", {
	id: uuid("id").primaryKey().defaultRandom(),
	submissionId: uuid("submission_id").references(() => homeworkSubmissions.id),
	assignmentId: uuid("assignment_id").references(() => homeworkAssignments.id),
	uploadedBy: uuid("uploaded_by")
		.notNull()
		.references(() => users.id),
	fileName: text("file_name").notNull(),
	fileUrl: text("file_url").notNull(),
	fileSize: integer("file_size").notNull(),
	mimeType: text("mime_type").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
	id: uuid("id").primaryKey().defaultRandom(),
	therapistId: uuid("therapist_id")
		.notNull()
		.references(() => users.id),
	clientId: uuid("client_id")
		.notNull()
		.references(() => users.id),
	sessionId: uuid("session_id").references(() => sessions.id),
	amountCents: integer("amount_cents").notNull(),
	currency: text("currency").notNull().default("USD"),
	status: paymentStatusEnum("status").notNull().default("pending"),
	dueDate: date("due_date").notNull(),
	paidAt: timestamp("paid_at", { withTimezone: true }),
	paymentMethod: text("payment_method"),
	notes: text("notes"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const auditLogs = pgTable("audit_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	action: auditActionEnum("action").notNull(),
	resourceType: text("resource_type").notNull(),
	resourceId: uuid("resource_id").notNull(),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.unique()
		.references(() => users.id),
	pushEnabled: boolean("push_enabled").notNull().default(true),
	emailEnabled: boolean("email_enabled").notNull().default(true),
	reminderHours: integer("reminder_hours").notNull().default(24),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const pushTokensTable = pgTable(
	"push_tokens",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),
		token: text("token").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [unique("user_push_token_unique").on(table.userId, table.token)],
);

export const reviews = pgTable(
	"reviews",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		therapistId: uuid("therapist_id")
			.notNull()
			.references(() => users.id),
		clientId: uuid("client_id")
			.notNull()
			.references(() => users.id),
		rating: integer("rating").notNull(), // 1-5
		comment: text("comment"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [unique("one_review_per_client").on(table.therapistId, table.clientId)],
);
