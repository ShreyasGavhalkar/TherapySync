"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useApi } from "@/lib/hooks";
import { useUser } from "@/lib/user-context";
import { Check, Search, X } from "lucide-react";

type Payment = {
	id: string;
	amountCents: number;
	currency: string;
	status: string;
	dueDate: string;
	paidAt: string | null;
	paymentMethod: string | null;
	sessionId: string | null;
	clientName: string | null;
	sessionTitle: string | null;
	createdAt: string;
};

type PaymentSummary = { status: string; count: number; totalCents: number };
type Client = { id: string; client: { id: string; firstName: string; lastName: string } };

const statusColors: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800",
	paid: "bg-green-100 text-green-800",
	overdue: "bg-red-100 text-red-800",
	waived: "bg-gray-100 text-gray-800",
	refunded: "bg-blue-100 text-blue-800",
};

function formatCurrency(cents: number, currency = "USD") {
	if (cents === 0) return "—";
	return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default function PaymentsPage() {
	const api = useApi();
	const user = useUser();
	const searchParams = useSearchParams();
	const initialClientId = searchParams.get("clientId") ?? "";
	const isTherapist = user?.role === "therapist" || user?.role === "admin";

	const [payments, setPayments] = useState<Payment[]>([]);
	const [summary, setSummary] = useState<PaymentSummary[]>([]);
	const [clients, setClients] = useState<Client[]>([]);
	const [selectedClientIds, setSelectedClientIds] = useState<string[]>(initialClientId ? [initialClientId] : []);
	const [clientSearch, setClientSearch] = useState("");
	const [showClientDropdown, setShowClientDropdown] = useState(false);
	const [markingId, setMarkingId] = useState<string | null>(null);
	const [markAmount, setMarkAmount] = useState("");
	const [markMethod, setMarkMethod] = useState("");

	const fetchPayments = async () => {
		const qs = new URLSearchParams();
		qs.set("limit", "10");
		if (selectedClientIds.length > 0) qs.set("clientId", selectedClientIds.join(","));
		const data = await api.get(`/payments?${qs}`);
		setPayments(data);
	};

	useEffect(() => {
		fetchPayments().catch(console.error);
		api.get("/payments/summary").then(setSummary).catch(console.error);
		if (isTherapist) api.get("/therapist/clients").then(setClients).catch(console.error);
	}, [api]);

	useEffect(() => {
		fetchPayments().catch(console.error);
	}, [selectedClientIds]);

	const filteredClients = clients.filter((c) => {
		if (selectedClientIds.includes(c.client.id)) return false;
		if (!clientSearch.trim()) return true;
		const q = clientSearch.toLowerCase();
		return c.client.firstName.toLowerCase().includes(q) || c.client.lastName.toLowerCase().includes(q);
	});

	const toggleClient = (id: string) => {
		setSelectedClientIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
		setClientSearch("");
		setShowClientDropdown(false);
	};

	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setShowClientDropdown(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const getClientName = (id: string) => {
		const c = clients.find((x) => x.client.id === id);
		return c ? `${c.client.firstName} ${c.client.lastName}` : id;
	};

	const paidTotal = summary.find((s) => s.status === "paid")?.totalCents ?? 0;
	const pendingTotal = summary.find((s) => s.status === "pending")?.totalCents ?? 0;
	const pendingCount = summary.find((s) => s.status === "pending")?.count ?? 0;
	const overdueCount = summary.find((s) => s.status === "overdue")?.count ?? 0;
	const totalCount = summary.reduce((acc, s) => acc + s.count, 0);

	const handleMarkPaid = async (paymentId: string) => {
		const amount = Number.parseFloat(markAmount);
		if (!amount || amount <= 0) { alert("Please enter a valid amount"); return; }
		try {
			await api.post(`/payments/${paymentId}/mark-paid`, {
				amountCents: Math.round(amount * 100),
				paymentMethod: markMethod || null,
			});
			setMarkingId(null);
			setMarkAmount("");
			setMarkMethod("");
			fetchPayments();
			api.get("/payments/summary").then(setSummary).catch(console.error);
		} catch (err: any) {
			alert(err.message);
		}
	};

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Payments</h1>

			{/* Summary */}
			{isTherapist ? (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
						<p className="text-sm text-gray-500">Total Received</p>
						<p className="text-2xl font-bold text-green-600">{formatCurrency(paidTotal)}</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
						<p className="text-sm text-gray-500">Pending</p>
						<p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
						<p className="text-sm text-gray-500">Overdue</p>
						<p className="text-2xl font-bold text-red-600">{overdueCount}</p>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					<div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
						<p className="text-sm text-gray-500">Pending Payment</p>
						<p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingTotal)}</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
						<p className="text-sm text-gray-500">Total Payments</p>
						<p className="text-2xl font-bold text-gray-700">{totalCount}</p>
					</div>
				</div>
			)}

			{/* Client filter */}
			{isTherapist && clients.length > 0 && (
				<div className="mb-4">
					{/* Selected chips */}
					<div className="flex flex-wrap gap-2 mb-2">
						{selectedClientIds.map((id) => (
							<span key={id} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
								<span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
									{getClientName(id).split(" ").map((n) => n[0]).join("")}
								</span>
								{getClientName(id)}
								<button type="button" onClick={() => toggleClient(id)} className="hover:text-primary-dark">
									<X size={14} />
								</button>
							</span>
						))}
						{selectedClientIds.length > 0 && (
							<button type="button" onClick={() => setSelectedClientIds([])} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
								Clear all
							</button>
						)}
					</div>

					{/* Search input */}
					<div className="relative" ref={dropdownRef}>
						<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							value={clientSearch}
							onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
							onFocus={() => setShowClientDropdown(true)}
							placeholder={selectedClientIds.length > 0 ? "Add another client..." : "Filter by client..."}
							className="w-full max-w-sm pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
						/>

						{showClientDropdown && filteredClients.length > 0 && (
							<div className="absolute z-50 mt-1 w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
								{filteredClients.map((c) => (
									<button
										key={c.client.id}
										type="button"
										onClick={() => toggleClient(c.client.id)}
										className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
									>
										<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
											{c.client.firstName[0]}{c.client.lastName[0]}
										</div>
										<span className="text-sm">{c.client.firstName} {c.client.lastName}</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Payments list */}
			<div className="bg-white rounded-xl border border-gray-200">
				{payments.length === 0 ? (
					<p className="p-6 text-gray-500 text-center">No payments</p>
				) : (
					<div className="divide-y divide-gray-100">
						{payments.map((p) => (
							<div key={p.id} className="p-4">
								<div className="flex items-center justify-between mb-1">
									<div>
										<p className="font-medium">
											{p.sessionTitle ?? "Manual payment"}
											{isTherapist && p.clientName && (
												<span className="text-gray-500 font-normal"> — {p.clientName}</span>
											)}
										</p>
										<p className="text-xs text-gray-500">
											{format(new Date(p.createdAt), "dd/MM/yyyy")}
										</p>
									</div>
									<div className="flex items-center gap-3">
										{p.status === "paid" ? (
											<div className="text-right">
												<span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Paid</span>
												<p className="text-sm font-semibold text-green-700 mt-1">{formatCurrency(p.amountCents, p.currency)}</p>
											</div>
										) : (
											<span className={`text-xs px-2 py-1 rounded-full ${statusColors[p.status] ?? "bg-gray-100"}`}>
												{p.status}
											</span>
										)}
									</div>
								</div>

								{/* Mark as paid (therapist only, pending/overdue payments) */}
								{isTherapist && (p.status === "pending" || p.status === "overdue") && (
									markingId === p.id ? (
										<div className="mt-3 flex items-end gap-2 bg-gray-50 p-3 rounded-lg">
											<div className="flex-1">
												<label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
												<input
													type="number"
													step="0.01"
													value={markAmount}
													onChange={(e) => setMarkAmount(e.target.value)}
													placeholder="0.00"
													className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
												/>
											</div>
											<div className="flex-1">
												<label className="block text-xs text-gray-500 mb-1">Method</label>
												<input
													type="text"
													value={markMethod}
													onChange={(e) => setMarkMethod(e.target.value)}
													placeholder="Cash, UPI..."
													className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
												/>
											</div>
											<button type="button" onClick={() => handleMarkPaid(p.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">
												<Check size={16} />
											</button>
											<button type="button" onClick={() => setMarkingId(null)} className="text-gray-400 hover:text-gray-600">
												<X size={16} />
											</button>
										</div>
									) : (
										<button
											type="button"
											onClick={() => { setMarkingId(p.id); setMarkAmount(""); setMarkMethod(""); }}
											className="mt-2 text-sm text-primary hover:underline"
										>
											Mark as paid
										</button>
									)
								)}
							</div>
						))}
					</div>
				)}
			</div>

			<p className="text-xs text-gray-400 text-center mt-3">Showing last 10 payments</p>
		</div>
	);
}
