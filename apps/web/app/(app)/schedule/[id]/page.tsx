"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useApi } from "@/lib/hooks";
import { useUser } from "@/lib/user-context";
import { FileText } from "lucide-react";

type SessionDetail = {
	id: string;
	title: string;
	startTime: string;
	endTime: string;
	status: string;
	location: string | null;
	recurrenceRule: string | null;
	cancelReason: string | null;
	therapist: { id: string; firstName: string; lastName: string; email: string };
	client: { id: string; firstName: string; lastName: string; email: string };
};

type SessionNote = {
	id: string;
	content: string;
	isSigned: boolean;
	signedAt: string | null;
} | null;

const statusColors: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800",
	confirmed: "bg-green-100 text-green-800",
	cancelled: "bg-red-100 text-red-800",
	completed: "bg-blue-100 text-blue-800",
	no_show: "bg-gray-100 text-gray-800",
};

export default function SessionDetailPage() {
	const { id } = useParams();
	const router = useRouter();
	const api = useApi();
	const user = useUser();
	const isTherapist = user?.role === "therapist" || user?.role === "admin";

	const [session, setSession] = useState<SessionDetail | null>(null);
	const [note, setNote] = useState<SessionNote>(null);
	const [noteContent, setNoteContent] = useState("");
	const [editingNote, setEditingNote] = useState(false);
	const [loading, setLoading] = useState<string | null>(null);

	const fetchSession = async () => {
		const data = await api.get(`/sessions/${id}`);
		setSession(data);
	};

	const fetchNote = async () => {
		try {
			const data = await api.get(`/sessions/${id}/notes`);
			setNote(data);
		} catch { /* no note yet */ }
	};

	useEffect(() => {
		if (id) {
			fetchSession().catch(console.error);
			if (isTherapist) fetchNote().catch(console.error);
		}
	}, [id, api]);

	const handleAction = async (action: string) => {
		setLoading(action);
		try {
			if (action === "confirm") {
				await api.post(`/sessions/${id}/confirm`, {});
			} else if (action === "complete") {
				await api.patch(`/sessions/${id}`, { status: "completed" });
			} else if (action === "cancel") {
				const reason = prompt("Reason for cancellation (optional):");
				await api.post(`/sessions/${id}/cancel`, { reason: reason || undefined });
			}
			fetchSession();
		} catch (err: any) {
			alert(err.message);
		} finally {
			setLoading(null);
		}
	};

	const handleSaveNote = async () => {
		if (!noteContent.trim()) return;
		setLoading("note");
		try {
			if (note) {
				await api.patch(`/sessions/${id}/notes`, { content: noteContent.trim() });
			} else {
				await api.post(`/sessions/${id}/notes`, { content: noteContent.trim() });
			}
			setEditingNote(false);
			fetchNote();
		} catch (err: any) {
			alert(err.message);
		} finally {
			setLoading(null);
		}
	};

	const handleSignNote = async () => {
		if (!confirm("Once signed, this note cannot be edited. Continue?")) return;
		setLoading("sign");
		try {
			await api.post(`/sessions/${id}/notes/sign`, {});
			fetchNote();
		} catch (err: any) {
			alert(err.message);
		} finally {
			setLoading(null);
		}
	};

	if (!session) {
		return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
	}

	const canConfirm = session.status === "pending";
	const canComplete = session.status === "confirmed" && isTherapist;
	const canCancel = session.status === "pending" || session.status === "confirmed";
	const canEdit = (session.status === "pending" || session.status === "confirmed") && isTherapist;

	return (
		<div className="max-w-3xl">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">{session.title}</h1>
				<span className={`text-sm px-3 py-1 rounded-full ${statusColors[session.status]}`}>
					{session.status.replace("_", " ")}
				</span>
			</div>

			{/* Details */}
			<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<h2 className="font-semibold mb-3">Details</h2>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p className="text-gray-500">Date</p>
						<p className="font-medium">{format(new Date(session.startTime), "EEEE, MMMM d, yyyy")}</p>
					</div>
					<div>
						<p className="text-gray-500">Time</p>
						<p className="font-medium">{format(new Date(session.startTime), "h:mm a")} — {format(new Date(session.endTime), "h:mm a")}</p>
					</div>
					{session.location && (
						<div>
							<p className="text-gray-500">Location</p>
							<p className="font-medium">{session.location}</p>
						</div>
					)}
				</div>
			</div>

			{/* Participants */}
			<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<h2 className="font-semibold mb-3">Participants</h2>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p className="text-gray-500">Therapist</p>
						<p className="font-medium">{session.therapist.firstName} {session.therapist.lastName}</p>
						<p className="text-xs text-gray-400">{session.therapist.email}</p>
					</div>
					<div>
						<p className="text-gray-500">Client</p>
						<p className="font-medium">{session.client.firstName} {session.client.lastName}</p>
						<p className="text-xs text-gray-400">{session.client.email}</p>
					</div>
				</div>
			</div>

			{/* Cancellation reason */}
			{session.status === "cancelled" && session.cancelReason && (
				<div className="bg-red-50 rounded-xl border border-red-200 p-6 mb-6">
					<h2 className="font-semibold text-red-800 mb-2">Cancellation</h2>
					<p className="text-sm text-red-700">Reason: {session.cancelReason}</p>
				</div>
			)}

			{/* Session Notes — therapist only */}
			{isTherapist && (
				<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
					<div className="flex items-center justify-between mb-3">
						<h2 className="font-semibold flex items-center gap-2">
							<FileText size={18} /> Session Notes
						</h2>
						{note?.isSigned && (
							<span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Signed</span>
						)}
					</div>

					{editingNote || !note ? (
						<>
							<textarea
								value={noteContent || (editingNote ? note?.content : "") || ""}
								onChange={(e) => setNoteContent(e.target.value)}
								rows={6}
								placeholder="Write your session notes here..."
								className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
							/>
							<div className="flex gap-2">
								<button type="button" onClick={handleSaveNote} disabled={loading === "note"} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50">
									{loading === "note" ? "Saving..." : note ? "Update Note" : "Save Note"}
								</button>
								{note && (
									<button type="button" onClick={() => setEditingNote(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">Cancel</button>
								)}
							</div>
						</>
					) : (
						<>
							<p className="text-gray-700 whitespace-pre-wrap mb-3">{note.content}</p>
							{!note.isSigned && (
								<div className="flex gap-2">
									<button type="button" onClick={() => { setNoteContent(note.content); setEditingNote(true); }} className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50">Edit</button>
									<button type="button" onClick={handleSignNote} disabled={loading === "sign"} className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50">
										{loading === "sign" ? "Signing..." : "Sign & Lock"}
									</button>
								</div>
							)}
							{note.signedAt && (
								<p className="text-xs text-gray-400 mt-2">Signed on {format(new Date(note.signedAt), "MMM d, yyyy 'at' h:mm a")}</p>
							)}
						</>
					)}
				</div>
			)}

			{/* Action buttons */}
			<div className="flex flex-wrap gap-3">
				{canConfirm && (
					<button type="button" onClick={() => handleAction("confirm")} disabled={loading === "confirm"} className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark disabled:opacity-50">
						{loading === "confirm" ? "Confirming..." : "Confirm Session"}
					</button>
				)}
				{canComplete && (
					<button type="button" onClick={() => handleAction("complete")} disabled={loading === "complete"} className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark disabled:opacity-50">
						{loading === "complete" ? "Completing..." : "Mark as Completed"}
					</button>
				)}
				{canEdit && (
					<button type="button" onClick={() => router.push(`/schedule/create?edit=${id}`)} className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50">
						Reschedule / Edit
					</button>
				)}
				{canCancel && (
					<button type="button" onClick={() => handleAction("cancel")} disabled={loading === "cancel"} className="bg-red-50 text-red-600 px-5 py-2.5 rounded-lg hover:bg-red-100 disabled:opacity-50">
						{loading === "cancel" ? "Cancelling..." : "Cancel Session"}
					</button>
				)}
			</div>
		</div>
	);
}
