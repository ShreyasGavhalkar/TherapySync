"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/hooks";
import { useTheme } from "@/lib/theme-context";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Sun, Moon, Monitor } from "lucide-react";

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

type ThemeMode = "system" | "light" | "dark";

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
	{ value: "system", label: "System", icon: Monitor },
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
];

export default function ProfilePage() {
	const api = useApi();
	const { signOut } = useClerk();
	const router = useRouter();
	const { mode, setMode } = useTheme();
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

			{/* User info */}
			<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
				<div className="flex items-center gap-4 mb-6">
					<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
						{user.firstName[0]}{user.lastName[0]}
					</div>
					<div>
						<h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
						<span className="text-sm text-primary font-medium capitalize bg-primary/10 px-2 py-0.5 rounded">{user.role}</span>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div>
						<p className="text-gray-500 dark:text-gray-400">Email</p>
						<p className="font-medium">{user.email}</p>
					</div>
					<div>
						<p className="text-gray-500 dark:text-gray-400">Phone</p>
						<p className="font-medium">{user.phone ?? "Not set"}</p>
					</div>
					<div>
						<p className="text-gray-500 dark:text-gray-400">Timezone</p>
						<p className="font-medium">{user.timezone}</p>
					</div>
					<div>
						<p className="text-gray-500 dark:text-gray-400">Member since</p>
						<p className="font-medium">{format(new Date(user.createdAt), "MMMM d, yyyy")}</p>
					</div>
				</div>
			</div>

			{/* Appearance */}
			<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
				<h3 className="font-semibold mb-4">Appearance</h3>
				<div className="grid grid-cols-3 gap-3">
					{themeOptions.map(({ value, label, icon: Icon }) => (
						<button
							key={value}
							type="button"
							onClick={() => setMode(value)}
							className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
								mode === value
									? "border-primary bg-primary/5 text-primary"
									: "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
							}`}
						>
							<Icon size={24} />
							<span className="text-sm font-medium">{label}</span>
						</button>
					))}
				</div>
			</div>

			{/* Sign out */}
			<button type="button" onClick={handleSignOut} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium">
				Sign Out
			</button>
		</div>
	);
}
