"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useApi } from "@/lib/hooks";
import { useUser } from "@/lib/user-context";
import { FileText, DollarSign } from "lucide-react";
import Link from "next/link";

type SessionDetail = {
	id: string;
	title: string;
	startTime: string;
	endTime: string;
	status: string;
	location: string | null;
	hasNote: boolean;
	noteId: string | null;
	noteSigned: boolean;
	payment: { id?: string; amountCents: number; currency: string; status: string } | null;
};

type RecentPayment = {
	id: string;
	amountCents: number;
	currency: string;
	status: string;
	dueDate: string;
	paidAt: string | null;
	sessionId: string | null;
	createdAt: string;
};

type ClientDetail = {
	person: { id: string; email: string; firstName: string; lastName: string; phone: string | null };
	relationship: { id: string; status: string; startedAt: string | null };
	sessions: SessionDetail[];
	recentPayments: RecentPayment[];
	totalPayments: number;
};

const sessionStatusColors: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800",
	confirmed: "bg-green-100 text-green-800",
	cancelled: "bg-red-100 text-red-800",
	completed: "bg-blue-100 text-blue-800",
	no_show: "bg-gray-100 text-gray-800",
};

const paymentStatusColors: Record<string, string> = {
	paid: "text-green-600",
	pending: "text-yellow-600",
	overdue: "text-red-600",
	unpaid: "text-red-600",
	waived: "text-gray-500",
};

function formatCurrency(cents: number, currency = "USD") {
	if (cents === 0) return "";
	return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatDDMMYYYY(d: Date) { return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; }

export default function ClientDetailPage() {
	const { id } = useParams();
	const api = useApi();
	const user = useUser();
	const isTherapist = user?.role === "therapist" || user?.role === "admin";
	const [data, setData] = useState<ClientDetail | null>(null);

	useEffect(() => {
		if (id) api.get(`/therapist/clients/detail/${id}`).then(setData).catch(console.error);
	}, [api, id]);

	if (!data) {
		return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
	}

	const { person, relationship, sessions } = data;
	const upcoming = sessions.filter((s) => s.status === "pending" || s.status === "confirmed");
	const past = sessions.filter((s) => s.status === "completed" || s.status === "cancelled" || s.status === "no_show");

	return (
		<div className="max-w-4xl">
			{/* Person header */}
			<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-4">
				<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
					{person.firstName[0]}{person.lastName[0]}
				</div>
				<div>
					<h1 className="text-2xl font-bold">{person.firstName} {person.lastName}</h1>
					<p className="text-gray-500">{person.email}</p>
					{person.phone && <p className="text-sm text-gray-400">{person.phone}</p>}
					{relationship.startedAt && (
						<p className="text-xs text-gray-400 mt-1">Connected since {format(new Date(relationship.startedAt), "MMM d, yyyy")}</p>
					)}
				</div>
			</div>

			{/* Upcoming sessions */}
			{upcoming.length > 0 && (
				<div className="mb-6">
					<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h2>
					<div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
						{upcoming.map((s) => (
							<SessionRow key={s.id} session={s} isTherapist={isTherapist} />
						))}
					</div>
				</div>
			)}

			{/* Past sessions */}
			<div className="mb-6">
				<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past Sessions ({past.length})</h2>
				<div className="bg-white rounded-xl border border-gray-200">
					{past.length === 0 ? (
						<p className="p-6 text-gray-500 text-center">No past sessions</p>
					) : (
						<div className="divide-y divide-gray-100">
							{past.map((s) => (
								<SessionRow key={s.id} session={s} isTherapist={isTherapist} />
							))}
						</div>
					)}
				</div>
			</div>

			{/* Recent Payments */}
			{isTherapist && (
				<div>
					<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
						Recent Payments ({data.recentPayments.length}{data.totalPayments > 5 ? ` of ${data.totalPayments}` : ""})
					</h2>
					<div className="bg-white rounded-xl border border-gray-200">
						{data.recentPayments.length === 0 ? (
							<p className="p-6 text-gray-500 text-center">No payments yet</p>
						) : (
							<div className="divide-y divide-gray-100">
								{data.recentPayments.map((p) => (
									<div key={p.id} className="p-4 flex items-center justify-between">
										<div>
											<p className="text-sm">{format(new Date(p.createdAt), "dd/MM/yyyy")}</p>
										</div>
										<div className="flex items-center gap-3">
											{p.status === "paid" ? (
												<span className="text-sm font-semibold text-green-700">{formatCurrency(p.amountCents, p.currency)}</span>
											) : null}
											<span className={`text-xs px-2 py-0.5 rounded-full ${
												p.status === "paid" ? "bg-green-100 text-green-800" :
												p.status === "pending" ? "bg-yellow-100 text-yellow-800" :
												"bg-red-100 text-red-800"
											}`}>
												{p.status}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
					{data.totalPayments > 5 && (
						<div className="mt-2 text-center">
							<Link href={`/payments?clientId=${person.id}`} className="text-sm text-primary hover:underline">
								View all {data.totalPayments} payments
							</Link>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function SessionRow({ session, isTherapist }: { session: SessionDetail; isTherapist: boolean }) {
	const d = new Date(session.startTime);

	return (
		<Link href={`/schedule/${session.id}`} className="block p-4 hover:bg-gray-50 transition-colors cursor-pointer">
			<div className="flex-1">
				<div className="flex items-center gap-2 mb-1">
					<p className="font-medium">{session.title}</p>
					<span className={`text-xs px-2 py-0.5 rounded-full ${sessionStatusColors[session.status]}`}>
						{session.status.replace("_", " ")}
					</span>
				</div>
				<p className="text-sm text-gray-500">
					{formatDDMMYYYY(d)} {format(d, "h:mm a")} — {format(new Date(session.endTime), "h:mm a")}
				</p>

				{/* Indicators */}
				<div className="flex items-center gap-4 mt-2">
					{isTherapist && (
						<span className={`flex items-center gap-1 text-xs ${session.hasNote ? "text-blue-600" : "text-gray-400"}`}>
							<FileText size={13} />
							{session.hasNote ? (session.noteSigned ? "Signed" : "Draft") : "No notes"}
						</span>
					)}
					{session.payment && (
						<span className={`flex items-center gap-1 text-xs ${paymentStatusColors[session.payment.status]}`}>
							<DollarSign size={13} />
							{session.payment.status === "unpaid"
								? "Unpaid"
								: session.payment.status === "paid"
									? `Paid ${formatCurrency(session.payment.amountCents, session.payment.currency)}`
									: session.payment.status.charAt(0).toUpperCase() + session.payment.status.slice(1)}
						</span>
					)}
				</div>
			</div>
		</Link>
	);
}
