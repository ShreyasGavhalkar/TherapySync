import { z } from "zod";
import { PAYMENT_STATUSES } from "../constants.js";

export const paymentSchema = z.object({
	id: z.string().uuid(),
	therapistId: z.string().uuid(),
	clientId: z.string().uuid(),
	sessionId: z.string().uuid().nullable(),
	amountCents: z.number().int().positive(),
	currency: z.string().default("USD"),
	status: z.enum(PAYMENT_STATUSES),
	dueDate: z.coerce.date(),
	paidAt: z.coerce.date().nullable(),
	paymentMethod: z.string().nullable(),
	notes: z.string().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const createPaymentSchema = paymentSchema.omit({
	id: true,
	paidAt: true,
	createdAt: true,
	updatedAt: true,
});

export const updatePaymentSchema = paymentSchema
	.pick({
		amountCents: true,
		status: true,
		dueDate: true,
		paymentMethod: true,
		notes: true,
	})
	.partial();

export type Payment = z.infer<typeof paymentSchema>;
export type CreatePayment = z.infer<typeof createPaymentSchema>;
export type UpdatePayment = z.infer<typeof updatePaymentSchema>;
