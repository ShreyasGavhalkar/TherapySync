import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import type {
	HomeworkAssignment,
	CreateHomework,
	HomeworkSubmission,
} from "@therapysync/shared";

type HomeworkDetail = HomeworkAssignment & {
	submissions: (HomeworkSubmission & {
		submitter: { id: string; firstName: string; lastName: string };
	})[];
	files: { id: string; fileName: string; fileUrl: string; mimeType: string }[];
};

export function useHomework(params?: { clientId?: string; status?: string }) {
	const api = useApiClient();
	const queryString = new URLSearchParams();
	if (params?.clientId) queryString.set("clientId", params.clientId);
	if (params?.status) queryString.set("status", params.status);
	const qs = queryString.toString();

	return useQuery({
		queryKey: ["homework", params],
		queryFn: () => api.get<HomeworkAssignment[]>(`/homework${qs ? `?${qs}` : ""}`),
	});
}

export function useHomeworkDetail(id: string | undefined) {
	const api = useApiClient();
	return useQuery({
		queryKey: ["homework", id],
		queryFn: () => api.get<HomeworkDetail>(`/homework/${id}`),
		enabled: !!id,
	});
}

export function useCreateHomework() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateHomework) => api.post<HomeworkAssignment>("/homework", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["homework"] });
		},
	});
}

export function useUpdateHomework() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<HomeworkAssignment> }) =>
			api.patch<HomeworkAssignment>(`/homework/${id}`, data),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["homework"] });
			queryClient.invalidateQueries({ queryKey: ["homework", id] });
		},
	});
}

export function useSubmitHomework() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ assignmentId, content }: { assignmentId: string; content: string }) =>
			api.post<HomeworkSubmission>(`/homework/${assignmentId}/submissions`, { content }),
		onSuccess: (_, { assignmentId }) => {
			queryClient.invalidateQueries({ queryKey: ["homework"] });
			queryClient.invalidateQueries({ queryKey: ["homework", assignmentId] });
		},
	});
}
