"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/hooks";
import { Star, Search } from "lucide-react";
import Link from "next/link";

type Therapist = {
	id: string;
	firstName: string;
	lastName: string;
	bio: string | null;
	specializations: string | null;
	city: string | null;
	averageRating: number | null;
	totalReviews: number;
};

export default function DiscoverPage() {
	const api = useApi();
	const [therapists, setTherapists] = useState<Therapist[]>([]);
	const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
	const [city, setCity] = useState("");
	const [loading, setLoading] = useState(true);

	const fetchTherapists = async () => {
		setLoading(true);
		const qs = city.trim() ? `?city=${encodeURIComponent(city.trim())}` : "";
		const data = await api.get(`/discover/therapists${qs}`);
		setTherapists(data);
		setLoading(false);
	};

	useEffect(() => {
		fetchTherapists().catch(console.error);
		// Fetch existing relationships to filter out active connections
		api.get("/relationships").then((rels: any[]) => {
			const activeIds = new Set(
				rels.filter((r) => r.status === "active").map((r) => r.therapist?.id).filter(Boolean),
			);
			setConnectedIds(activeIds);
		}).catch(console.error);
	}, [api]);

	const filteredTherapists = therapists.filter((t) => !connectedIds.has(t.id));

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		fetchTherapists().catch(console.error);
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Find a Therapist</h1>
			</div>

			<form onSubmit={handleSearch} className="flex gap-3 mb-6">
				<div className="relative flex-1">
					<Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
					<input
						type="text"
						value={city}
						onChange={(e) => setCity(e.target.value)}
						placeholder="Search by city..."
						className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
					/>
				</div>
				<button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors">
					Search
				</button>
			</form>

			{loading ? (
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
				</div>
			) : filteredTherapists.length === 0 ? (
				<p className="text-center text-gray-500 py-12">No therapists found</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredTherapists.map((t) => (
						<Link key={t.id} href={`/discover/${t.id}`} className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
							<div className="flex items-start justify-between mb-3">
								<div>
									<h3 className="font-semibold text-lg">{t.firstName} {t.lastName}</h3>
									{t.city && <p className="text-sm text-gray-500">{t.city}</p>}
								</div>
								<div className="flex items-center gap-1">
									<Star size={16} className="text-yellow-500 fill-yellow-500" />
									<span className="font-semibold">{t.averageRating ? t.averageRating.toFixed(1) : "—"}</span>
									<span className="text-xs text-gray-400">({t.totalReviews})</span>
								</div>
							</div>
							{t.specializations && (
								<p className="text-xs text-primary mb-2">{t.specializations}</p>
							)}
							{t.bio && (
								<p className="text-sm text-gray-600 line-clamp-2">{t.bio}</p>
							)}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
