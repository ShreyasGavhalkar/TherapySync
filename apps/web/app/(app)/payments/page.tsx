"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useApi } from "@/lib/hooks";
import { Plus } from "lucide-react";

type Payment = {
	id: string;
	amountCents: number;
	currency: string;
	status: string;
	dueDate: string;
	paidAt: string | null;
	paymentMethod: string | null;
	notes: string | null;
};

type PaymentSummary = { status: string; count: number; totalCents: number };

const statusColors: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800",
	paid: "bg-green-100 text-green-800",
	overdue: "bg-red-100 text-red-800",
	waived: "bg-gray-100 text-gray-800",
	refunded: "bg-blue-100 text-blue-800",
};

function formatCurrency(cents: number, currency = "USD") {
	return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default function PaymentsPage() {
	const api = useApi();
	const [payments, setPayments] = useState<Payment[]>([]);
	const [summary, setSummary] = useState<PaymentSummary[]>([]);
	const [showCreate, setShowCreate] = useState(false);
	const [clients, setClients] = useState<any[]>([]);
	const [form, setForm] = useState({ clientId: "", amount: "", dueDate: "", status: "pending", paymentMethod: "", notes: "" });
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		api.get("/payments").then(setPayments).catch(console.error);
		api.get("/payments/summary").then(setSummary).catch(console.error);
	}, [api]);

	const paidTotal = summary.find((s) => s.status === "paid")?.totalCents ?? 0;
	const pendingTotal = summary.find((s) => s.status === "pending")?.totalCents ?? 0;
	const overdueTotal = summary.find((s) => s.status === "overdue")?.totalCents ?? 0;

	const handleOpenCreate = async () => {
		setShowCreate(true);
		if (clients.length === 0) {
			const data = await api.get("/therapist/clients");
			setClients(data);
		}
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await api.post("/payments", {
				therapistId: "",
				clientId: form.clientId,
				sessionId: null,
				amountCents: Math.round(Number.parseFloat(form.amount) * 100),
				currency: "USD",
				status: form.status,
				dueDate: new Date(form.dueDate).toISOString(),
				paymentMethod: form.paymentMethod || null,
				notes: form.notes || null,
			});
			setShowCreate(false);
			setForm({ clientId: "", amount: "", dueDate: "", status: "pending", paymentMethod: "", notes: "" });
			const [p, s] = await Promise.all([api.get("/payments"), api.get("/payments/summary")]);
			setPayments(p);
			setSummary(s);
		} catch (err: any) {
			alert(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Payments</h1>
				<button type="button" onClick={handleOpenCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
					<Plus size={18} />
					Record Payment
				</button>
			</div>

			{/* Summary */}
			{summary.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
						<p className="text-sm text-gray-500">Paid</p>
						<p className="text-2xl font-bold text-green-600">{formatCurrency(paidTotal)}</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
						<p className="text-sm text-gray-500">Pending</p>
						<p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingTotal)}</p>
					</div>
					<div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
						<p className="text-sm text-gray-500">Overdue</p>
						<p className="text-2xl font-bold text-red-600">{formatCurrency(overdueTotal)}</p>
					</div>
				</div>
			)}

			{/* Create form */}
			{showCreate && (
				<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
					<h2 className="font-semibold mb-4">Record Payment</h2>
					<form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm text-gray-600 mb-1">Client</label>
							<select value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2">
								<option value="">Select client</option>
								{clients.map((c: any) => (
									<option key={c.client.id} value={c.client.id}>{c.client.firstName} {c.client.lastName}</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">Amount ($)</label>
							<input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">Status</label>
							<select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2">
								<option value="pending">Pending</option>
								<option value="paid">Paid</option>
							</select>
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">Due Date</label>
							<input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2" />
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">Payment Method</label>
							<input type="text" value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., Cash, UPI" />
						</div>
						<div>
							<label className="block text-sm text-gray-600 mb-1">Notes</label>
							<input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
						</div>
						<div className="md:col-span-2 flex gap-3">
							<button type="submit" disabled={loading} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50">
								{loading ? "Saving..." : "Save Payment"}
							</button>
							<button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
						</div>
					</form>
				</div>
			)}

			{/* Payments list */}
			<div className="bg-white rounded-xl border border-gray-200">
				{payments.length === 0 ? (
					<p className="p-6 text-gray-500 text-center">No payments</p>
				) : (
					<table className="w-full">
						<thead className="border-b border-gray-200">
							<tr>
								<th className="text-left p-4 text-sm font-medium text-gray-500">Amount</th>
								<th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
								<th className="text-left p-4 text-sm font-medium text-gray-500">Due Date</th>
								<th className="text-left p-4 text-sm font-medium text-gray-500">Method</th>
							</tr>
						</thead>
						<tbody>
							{payments.map((p) => (
								<tr key={p.id} className="border-b border-gray-100 last:border-0">
									<td className="p-4 font-medium">{formatCurrency(p.amountCents, p.currency)}</td>
									<td className="p-4">
										<span className={`text-xs px-2 py-1 rounded-full ${statusColors[p.status]}`}>
											{p.status}
										</span>
									</td>
									<td className="p-4 text-gray-600">{format(new Date(p.dueDate), "MMM d, yyyy")}</td>
									<td className="p-4 text-gray-500">{p.paymentMethod ?? "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
