export const USER_ROLES = ["admin", "therapist", "client"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CLIENT_STATUSES = ["active", "archived", "pending_invite", "pending_approval", "rejected"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const SESSION_STATUSES = [
	"pending",
	"confirmed",
	"cancelled",
	"completed",
	"no_show",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const HOMEWORK_STATUSES = [
	"assigned",
	"in_progress",
	"submitted",
	"reviewed",
	"overdue",
] as const;
export type HomeworkStatus = (typeof HOMEWORK_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "overdue", "waived", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const AUDIT_ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const DEFAULT_TIMEZONE = "Asia/Kolkata";
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_REMINDER_HOURS = 24;
