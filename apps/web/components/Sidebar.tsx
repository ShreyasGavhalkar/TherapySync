"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Calendar, Users, BookOpen, CreditCard, User, LayoutDashboard, Search } from "lucide-react";

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
	{ href: "/schedule", label: "Schedule", icon: Calendar, roles: ["admin", "therapist", "client"] },
	{ href: "/clients", label: "Connections", icon: Users, roles: ["admin", "therapist", "client"] },
	{ href: "/homework", label: "Homework", icon: BookOpen, roles: ["admin", "therapist", "client"] },
	{ href: "/payments", label: "Payments", icon: CreditCard, roles: ["admin", "therapist", "client"] },
	{ href: "/discover", label: "Find Therapist", icon: Search, roles: ["client"] },
	{ href: "/profile", label: "Profile", icon: User, roles: ["admin", "therapist", "client"] },
];

export default function Sidebar({ role }: { role: string }) {
	const pathname = usePathname();

	const filteredItems = navItems.filter((item) => item.roles.includes(role));

	return (
		<aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
			<div className="p-6 border-b border-gray-200">
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
									: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
							}`}
						>
							<Icon size={20} />
							{item.label}
						</Link>
					);
				})}
			</nav>
			<div className="p-4 border-t border-gray-200">
				<UserButton afterSignOutUrl="/sign-in" />
			</div>
		</aside>
	);
}
