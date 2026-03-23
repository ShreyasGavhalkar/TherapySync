"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/hooks";
import { useUser } from "@/lib/user-context";
import { ChevronRight, Search, UserPlus } from "lucide-react";
import Link from "next/link";

type Relationship = {
	id: string;
	status: string;
	initiatedBy: string | null;
	client?: { id: string; email: string; firstName: string; lastName: string };
	therapist?: { id: string; email: string; firstName: string; lastName: string };
};

type Tab = "active" | "requests";

export default function ClientsPage() {
	const api = useApi();
	const user = useUser();
	const isTherapist = user?.role === "therapist" || user?.role === "admin";
	const [relationships, setRelationships] = useState<Relationship[]>([]);
	const [tab, setTab] = useState<Tab>("active");
	const [showInvite, setShowInvite] = useState(false);
	const [inviteForm, setInviteForm] = useState({ email: "", firstName: "", lastName: "" });
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");

	const fetchData = async () => {
		const path = isTherapist ? "/therapist/clients" : "/relationships";
		const data = await api.get(path);
		setRelationships(data);
	};

	useEffect(() => {
		fetchData().catch(console.error);
	}, [api]);

	const { requests, active } = useMemo(() => ({
		requests: relationships.filter((r) => r.status === "pending_invite" || r.status === "pending_approval"),
		active: relationships.filter((r) => r.status === "active"),
	}), [relationships]);

	const filterBySearch = (list: Relationship[]) => {
		if (!search.trim()) return list;
		const q = search.toLowerCase();
		return list.filter((rel) => {
			const person = isTherapist ? rel.client : rel.therapist;
			if (!person) return false;
			return person.firstName.toLowerCase().includes(q) || person.lastName.toLowerCase().includes(q) || person.email.toLowerCase().includes(q);
		});
	};

	const currentList = filterBySearch(tab === "requests" ? requests : active);

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await api.post("/therapist/clients/invite", inviteForm);
			setShowInvite(false);
			setInviteForm({ email: "", firstName: "", lastName: "" });
			fetchData();
		} catch (err: any) {
			alert(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleAccept = async (id: string) => {
		try { await api.post(`/relationships/${id}/accept`, {}); fetchData(); } catch (err: any) { alert(err.message); }
	};

	const handleReject = async (id: string) => {
		if (!confirm("Are you sure?")) return;
		try { await api.post(`/relationships/${id}/reject`, {}); fetchData(); } catch (err: any) { alert(err.message); }
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">{isTherapist ? "Clients" : "My Therapists"}</h1>
				{isTherapist && (
					<button type="button" onClick={() => setShowInvite(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
						<UserPlus size={18} /> Invite Client
					</button>
				)}
			</div>

			{showInvite && (
				<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
					<h2 className="font-semibold mb-4">Invite New Client</h2>
					<form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
						<div>
							<label className="block text-sm text-gray-600 mb-1">First Name</label>
							<input type="text" value={inviteForm.firstName} onChange={(e) => setInviteForm((f) => ({ ...f, firstName: e.target.value }))} required className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">Last Name</label>
							<input type="text" value={inviteForm.lastName} onChange={(e) => setInviteForm((f) => ({ ...f, lastName: e.target.value }))} required className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">Email</label>
							<input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} required className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
						</div>
						<button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50">{loading ? "Inviting..." : "Send Invite"}</button>
						<button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
					</form>
				</div>
			)}

			{/* Tabs */}
			<div className="flex border-b border-gray-200 mb-6">
				<button
					type="button"
					onClick={() => setTab("active")}
					className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
						tab === "active"
							? "border-primary text-primary"
							: "border-transparent text-gray-500 hover:text-gray-700"
					}`}
				>
					Connections{active.length > 0 ? ` (${active.length})` : ""}
				</button>
				<button
					type="button"
					onClick={() => setTab("requests")}
					className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
						tab === "requests"
							? "border-primary text-primary"
							: "border-transparent text-gray-500 hover:text-gray-700"
					}`}
				>
					Requests{requests.length > 0 ? ` (${requests.length})` : ""}
				</button>
			</div>

		{/* Search */}
			<div className="relative mb-4">
				<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search by name or email..."
					className="w-full max-w-sm pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
				/>
			</div>

			{/* Content */}
			<div className="bg-white rounded-xl border border-gray-200">
				{currentList.length === 0 ? (
					<p className="p-6 text-gray-500 text-center">
						{tab === "requests"
							? "No pending requests"
							: isTherapist
								? "No active clients yet"
								: "No active connections yet"}
					</p>
				) : (
					<div className="divide-y divide-gray-100">
						{currentList.map((rel) => {
							const person = isTherapist ? rel.client : rel.therapist;
							if (!person) return null;

							if (tab === "requests") {
								const needsMyAction =
									(rel.status === "pending_invite" && rel.initiatedBy !== user?.id) ||
									(rel.status === "pending_approval" && rel.initiatedBy !== user?.id);
								const iSent = rel.initiatedBy === user?.id;

								return (
									<div key={rel.id} className="p-4 flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
												{person.firstName[0]}{person.lastName[0]}
											</div>
											<div>
												<p className="font-medium">{person.firstName} {person.lastName}</p>
												<p className="text-sm text-gray-500">{person.email}</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											{needsMyAction ? (
												<>
													<button type="button" onClick={() => handleAccept(rel.id)} className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-dark">Accept</button>
													<button type="button" onClick={() => handleReject(rel.id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100">Reject</button>
												</>
											) : (
												<span className="text-xs text-gray-400">Waiting for response...</span>
											)}
										</div>
									</div>
								);
							}

							// Active — clickable
							return (
								<Link key={rel.id} href={`/clients/${person.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
											{person.firstName[0]}{person.lastName[0]}
										</div>
										<div>
											<p className="font-medium">{person.firstName} {person.lastName}</p>
											<p className="text-sm text-gray-500">{person.email}</p>
										</div>
									</div>
									<ChevronRight size={18} className="text-gray-400" />
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
