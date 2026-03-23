"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Users, BookOpen, CreditCard, User, LayoutDashboard, Search } from "lucide-react";
import { useUser } from "@/lib/user-context";

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
	{ href: "/schedule", label: "Schedule", icon: Calendar, roles: ["admin", "therapist", "client"] },
	{ href: "/clients", label: "Connections", icon: Users, roles: ["admin", "therapist", "client"] },
	{ href: "/homework", label: "Homework", icon: BookOpen, roles: ["admin", "therapist", "client"] },
	{ href: "/payments", label: "Payments", icon: CreditCard, roles: ["admin", "therapist", "client"] },
	{ href: "/discover", label: "Find Therapist", icon: Search, roles: ["client"] },
];

export default function Sidebar({ role }: { role: string }) {
	const pathname = usePathname();
	const user = useUser();
	const filteredItems = navItems.filter((item) => item.roles.includes(role));
	const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "U";

	return (
		<aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col">
			<div className="p-6 border-b border-gray-200 dark:border-gray-700">
				<h1 className="text-xl font-bold text-primary">TherapySync</h1>
			</div>
			<nav className="flex-1 p-4 space-y-1">
				{filteredItems.map((item) => {
					const isActive = pathname.startsWith(item.href);
					const Icon = item.icon;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
								isActive
									? "bg-primary/10 text-primary"
									: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
							}`}
						>
							<Icon size={20} />
							{item.label}
						</Link>
					);
				})}
			</nav>
			<Link
				href="/profile"
				className={`mx-4 mb-4 flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
					pathname === "/profile"
						? "bg-primary/10"
						: "hover:bg-gray-100 dark:hover:bg-gray-700"
				}`}
			>
				<div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
					{initials}
				</div>
				<div className="min-w-0">
					<p className={`text-sm font-medium truncate ${pathname === "/profile" ? "text-primary" : ""}`}>
						{user ? `${user.firstName} ${user.lastName}` : "Profile"}
					</p>
					<p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{role}</p>
				</div>
			</Link>
		</aside>
	);
}
