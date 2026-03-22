import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { InviteClient } from "@therapysync/shared";

export type ClientRelationship = {
	id: string;
	status: string;
	initiatedBy: string | null;
	startedAt: string | null;
	client?: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		phone: string | null;
		avatarUrl: string | null;
	};
	therapist?: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		phone: string | null;
		avatarUrl: string | null;
	};
};

export function useClients() {
	const api = useApiClient();
	const role = useAuthStore((s) => s.dbUser?.role);
	const path = role === "client" ? "/relationships" : "/therapist/clients";

	return useQuery({
		queryKey: ["clients", role],
		queryFn: () => api.get<ClientRelationship[]>(path),
	});
}

export function useInviteClient() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: InviteClient) => api.post("/therapist/clients/invite", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
	});
}

export function useRequestTherapist() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (therapistId: string) => api.post("/relationships/request", { therapistId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
			queryClient.invalidateQueries({ queryKey: ["discover-therapists"] });
		},
	});
}

export function useAcceptRelationship() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => api.post(`/relationships/${id}/accept`, {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
	});
}

export function useRejectRelationship() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => api.post(`/relationships/${id}/reject`, {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clients"] });
		},
	});
}
