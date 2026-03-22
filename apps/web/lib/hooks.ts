"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useMemo } from "react";

export function useApi() {
	const { getToken } = useAuth();

	const request = useCallback(
		async (path: string, options: RequestInit = {}) => {
			const token = await getToken();
			const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

			const res = await fetch(`${API_URL}${path}`, {
				...options,
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
					...options.headers,
				},
			});

			if (!res.ok) {
				const error = await res.json().catch(() => ({ error: "Request failed" }));
				throw new Error(error.error ?? `HTTP ${res.status}`);
			}

			return res.json();
		},
		[getToken],
	);

	return useMemo(
		() => ({
			get: (path: string) => request(path),
			post: (path: string, body: unknown) => request(path, { method: "POST", body: JSON.stringify(body) }),
			patch: (path: string, body: unknown) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
			del: (path: string) => request(path, { method: "DELETE" }),
		}),
		[request],
	);
}
