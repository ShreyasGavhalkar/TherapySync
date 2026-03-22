import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";

type TherapistListing = {
	id: string;
	firstName: string;
	lastName: string;
	avatarUrl: string | null;
	bio: string | null;
	specializations: string | null;
	city: string | null;
	averageRating: number | null;
	totalReviews: number;
};

type TherapistProfile = TherapistListing & {
	phone: string | null;
	reviews: {
		id: string;
		rating: number;
		comment: string | null;
		createdAt: string;
		client: { firstName: string; lastName: string };
	}[];
};

type Review = {
	id: string;
	therapistId: string;
	rating: number;
	comment: string | null;
};

export function useDiscoverTherapists(params?: { lat?: number; lng?: number; radius?: number; city?: string }) {
	const api = useApiClient();
	const qs = new URLSearchParams();
	if (params?.lat) qs.set("lat", String(params.lat));
	if (params?.lng) qs.set("lng", String(params.lng));
	if (params?.radius) qs.set("radius", String(params.radius));
	if (params?.city) qs.set("city", params.city);
	const query = qs.toString();

	return useQuery({
		queryKey: ["discover-therapists", params],
		queryFn: () => api.get<TherapistListing[]>(`/discover/therapists${query ? `?${query}` : ""}`),
	});
}

export function useTherapistProfile(id: string | undefined) {
	const api = useApiClient();
	return useQuery({
		queryKey: ["therapist-profile", id],
		queryFn: () => api.get<TherapistProfile>(`/discover/therapists/${id}`),
		enabled: !!id,
	});
}

export function useSubmitReview() {
	const api = useApiClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { therapistId: string; rating: number; comment?: string }) =>
			api.post<Review>("/reviews", data),
		onSuccess: (_, { therapistId }) => {
			queryClient.invalidateQueries({ queryKey: ["therapist-profile", therapistId] });
			queryClient.invalidateQueries({ queryKey: ["discover-therapists"] });
		},
	});
}
