import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";

type NotificationPrefs = {
	id: string;
	pushEnabled: boolean;
	emailEnabled: boolean;
	reminderHours: number;
};

export function useNotificationPreferences() {
	const api = useApiClient();
	return useQuery({
		queryKey: ["notification-preferences"],
		queryFn: () => api.get<NotificationPrefs>("/notification-preferences"),
	});
}

export function useUpdateNotificationPreferences() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<NotificationPrefs>) =>
			api.patch<NotificationPrefs>("/notification-preferences", data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
		},
	});
}
