"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/hooks";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type User = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	phone: string | null;
	timezone: string;
	createdAt: string;
};

export default function ProfilePage() {
	const api = useApi();
	const { signOut } = useClerk();
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		api.get("/auth/me").then(setUser).catch(console.error);
	}, [api]);

	const handleSignOut = async () => {
		await signOut();
		router.push("/sign-in");
	};

	if (!user) {
		return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
	}

	return (
		<div className="max-w-2xl">
			<h1 className="text-2xl font-bold mb-6">Profile</h1>

			<div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
				<div className="flex items-center gap-4">
					<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
						{user.firstName[0]}{user.lastName[0]}
					</div>
					<div>
						<h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
						<span className="text-sm text-gray-500 capitalize">{user.role}</span>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<p className="text-gray-500">Email</p>
						<p className="font-medium">{user.email}</p>
					</div>
					<div>
						<p className="text-gray-500">Phone</p>
						<p className="font-medium">{user.phone ?? "Not set"}</p>
					</div>
					<div>
						<p className="text-gray-500">Timezone</p>
						<p className="font-medium">{user.timezone}</p>
					</div>
					<div>
						<p className="text-gray-500">Member since</p>
						<p className="font-medium">{format(new Date(user.createdAt), "MMMM d, yyyy")}</p>
					</div>
				</div>

				<button type="button" onClick={handleSignOut} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
					Sign Out
				</button>
			</div>
		</div>
	);
}
