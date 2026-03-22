"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/hooks";

type Stats = { totalUsers: number; totalSessions: number; totalPayments: number };

export default function DashboardPage() {
	const api = useApi();
	const [stats, setStats] = useState<Stats | null>(null);

	useEffect(() => {
		api.get("/admin/stats").then(setStats).catch(console.error);
	}, [api]);

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Dashboard</h1>
			{stats ? (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<StatCard label="Total Users" value={stats.totalUsers} />
					<StatCard label="Total Sessions" value={stats.totalSessions} />
					<StatCard label="Total Payments" value={stats.totalPayments} />
				</div>
			) : (
				<p className="text-gray-500">Loading stats...</p>
			)}
		</div>
	);
}

function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="bg-white rounded-xl border border-gray-200 p-6">
			<p className="text-sm text-gray-500">{label}</p>
			<p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
		</div>
	);
}
