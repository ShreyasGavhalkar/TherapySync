import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

type UploadParams = {
	uri: string;
	name: string;
	type: string;
	assignmentId?: string;
	submissionId?: string;
};

export function useUploadFile() {
	const { getToken } = useAuth();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ uri, name, type, assignmentId, submissionId }: UploadParams) => {
			const token = await getToken();
			const formData = new FormData();

			formData.append("file", {
				uri,
				name,
				type,
			} as unknown as Blob);

			if (assignmentId) formData.append("assignmentId", assignmentId);
			if (submissionId) formData.append("submissionId", submissionId);

			const res = await fetch(`${API_URL}/files/upload`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({ error: "Upload failed" }));
				throw new Error(error.error ?? `HTTP ${res.status}`);
			}

			return res.json();
		},
		onSuccess: (_, { assignmentId }) => {
			if (assignmentId) {
				queryClient.invalidateQueries({ queryKey: ["homework", assignmentId] });
			}
		},
	});
}
