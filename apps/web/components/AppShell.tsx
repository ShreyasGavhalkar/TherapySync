"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/hooks";
import { UserProvider } from "@/lib/user-context";
import Sidebar from "./Sidebar";

type DbUser = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	avatarUrl: string | null;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
	const api = useApi();
	const [user, setUser] = useState<DbUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.get("/auth/me")
			.then(setUser)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [api]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<UserProvider user={user}>
			<div className="flex min-h-screen">
				<Sidebar role={user?.role ?? "client"} />
				<main className="flex-1 p-8 overflow-auto">{children}</main>
			</div>
		</UserProvider>
	);
}
