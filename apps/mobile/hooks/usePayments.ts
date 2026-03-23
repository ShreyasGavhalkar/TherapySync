import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import type { Payment, CreatePayment, UpdatePayment } from "@therapysync/shared";

type PaymentSummary = {
	status: string;
	count: number;
	totalCents: number;
};

export function usePayments(params?: { clientId?: string; status?: string; limit?: number }) {
	const api = useApiClient();
	const queryString = new URLSearchParams();
	if (params?.clientId) queryString.set("clientId", params.clientId);
	if (params?.status) queryString.set("status", params.status);
	queryString.set("limit", String(params?.limit ?? 10));
	const qs = queryString.toString();

	return useQuery({
		queryKey: ["payments", params],
		queryFn: () => api.get<Payment[]>(`/payments?${qs}`),
	});
}

export function usePaymentSummary() {
	const api = useApiClient();
	return useQuery({
		queryKey: ["payments", "summary"],
		queryFn: () => api.get<PaymentSummary[]>("/payments/summary"),
	});
}

export function useCreatePayment() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreatePayment) => api.post<Payment>("/payments", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
		},
	});
}

export function useUpdatePayment() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdatePayment }) =>
			api.patch<Payment>(`/payments/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
		},
	});
}

export function useMarkPaid() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, amountCents, paymentMethod }: { id: string; amountCents: number; paymentMethod?: string }) =>
			api.post(`/payments/${id}/mark-paid`, { amountCents, paymentMethod: paymentMethod || null }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["payments"] });
			queryClient.invalidateQueries({ queryKey: ["client-detail"] });
		},
	});
}
