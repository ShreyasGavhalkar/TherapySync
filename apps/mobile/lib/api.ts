import { useAuth } from "@clerk/clerk-expo";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

type RequestOptions = {
	method?: string;
	body?: unknown;
	headers?: Record<string, string>;
};

export function useApiClient() {
	const { getToken } = useAuth();

	async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
		const token = await getToken();
		const { method = "GET", body, headers = {} } = options;

		const res = await fetch(`${API_URL}${path}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				...headers,
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!res.ok) {
			const error = await res.json().catch(() => ({ error: "Request failed" }));
			throw new Error(error.error ?? `HTTP ${res.status}`);
		}

		return res.json();
	}

	return {
		get: <T>(path: string) => request<T>(path),
		post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body }),
		patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }),
		delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
	};
}
