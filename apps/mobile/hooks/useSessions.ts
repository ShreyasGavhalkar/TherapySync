import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import type { Session, CreateSession, UpdateSession } from "@therapysync/shared";

type SessionDetail = Session & {
	therapist: { id: string; firstName: string; lastName: string; email: string };
	client: { id: string; firstName: string; lastName: string; email: string };
};

export function useSessions(params?: { from?: string; to?: string; clientId?: string }) {
	const api = useApiClient();
	const queryString = new URLSearchParams();
	if (params?.from) queryString.set("from", params.from);
	if (params?.to) queryString.set("to", params.to);
	if (params?.clientId) queryString.set("clientId", params.clientId);

	const qs = queryString.toString();

	return useQuery({
		queryKey: ["sessions", params],
		queryFn: () => api.get<Session[]>(`/sessions${qs ? `?${qs}` : ""}`),
	});
}

export function useSessionDetail(id: string | undefined) {
	const api = useApiClient();
	return useQuery({
		queryKey: ["session", id],
		queryFn: () => api.get<SessionDetail>(`/sessions/${id}`),
		enabled: !!id,
	});
}

export function useCreateSession() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateSession) => api.post<Session>("/sessions", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
		},
	});
}

export function useUpdateSession() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateSession }) =>
			api.patch<Session>(`/sessions/${id}`, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["session", id] });
		},
	});
}

export function useConfirmSession() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => api.post<Session>(`/sessions/${id}/confirm`, {}),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["session", id] });
		},
	});
}

export function useCancelSession() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
			api.post<Session>(`/sessions/${id}/cancel`, { reason }),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["session", id] });
		},
	});
}

export function useCompleteSession() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => api.patch<Session>(`/sessions/${id}`, { status: "completed" }),
		onSuccess: (_, id) => {
			queryClient.invalidateQueries({ queryKey: ["sessions"] });
			queryClient.invalidateQueries({ queryKey: ["session", id] });
			queryClient.invalidateQueries({ queryKey: ["client-detail"] });
		},
	});
}

// --- Session Notes ---

type SessionNote = {
	id: string;
	sessionId: string;
	therapistId: string;
	content: string;
	isSigned: boolean;
	signedAt: string | null;
};

export function useSessionNotes(sessionId: string | undefined) {
	const api = useApiClient();
	return useQuery({
		queryKey: ["session-notes", sessionId],
		queryFn: () => api.get<SessionNote | null>(`/sessions/${sessionId}/notes`),
		enabled: !!sessionId,
	});
}

export function useCreateNote() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
			api.post<SessionNote>(`/sessions/${sessionId}/notes`, { content }),
		onSuccess: (_, { sessionId }) => {
			queryClient.invalidateQueries({ queryKey: ["session-notes", sessionId] });
		},
	});
}

export function useUpdateNote() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
			api.patch<SessionNote>(`/sessions/${sessionId}/notes`, { content }),
		onSuccess: (_, { sessionId }) => {
			queryClient.invalidateQueries({ queryKey: ["session-notes", sessionId] });
		},
	});
}

export function useSignNote() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (sessionId: string) =>
			api.post<SessionNote>(`/sessions/${sessionId}/notes/sign`, {}),
		onSuccess: (_, sessionId) => {
			queryClient.invalidateQueries({ queryKey: ["session-notes", sessionId] });
		},
	});
}
