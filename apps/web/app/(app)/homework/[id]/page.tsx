"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useApi } from "@/lib/hooks";

type HomeworkDetail = {
	id: string;
	title: string;
	description: string;
	dueDate: string;
	status: string;
	createdAt: string;
	submissions: { id: string; content: string; submittedBy: string; createdAt: string }[];
	files: { id: string; fileName: string; fileUrl: string }[];
};

const statusColors: Record<string, string> = {
	assigned: "bg-blue-100 text-blue-800",
	in_progress: "bg-yellow-100 text-yellow-800",
	submitted: "bg-green-100 text-green-800",
	reviewed: "bg-gray-100 text-gray-800",
	overdue: "bg-red-100 text-red-800",
};

export default function HomeworkDetailPage() {
	const { id } = useParams();
	const api = useApi();
	const [homework, setHomework] = useState<HomeworkDetail | null>(null);
	const [submissionContent, setSubmissionContent] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (id) api.get(`/homework/${id}`).then(setHomework).catch(console.error);
	}, [api, id]);

	const handleSubmit = async () => {
		if (!submissionContent.trim()) return;
		setLoading(true);
		try {
			await api.post(`/homework/${id}/submissions`, { content: submissionContent });
			setSubmissionContent("");
			const data = await api.get(`/homework/${id}`);
			setHomework(data);
		} catch (err: any) {
			alert(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleMarkReviewed = async () => {
		try {
			await api.patch(`/homework/${id}`, { status: "reviewed" });
			const data = await api.get(`/homework/${id}`);
			setHomework(data);
		} catch (err: any) {
			alert(err.message);
		}
	};

	if (!homework) {
		return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
	}

	return (
		<div className="max-w-3xl">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">{homework.title}</h1>
				<span className={`text-sm px-3 py-1 rounded-full ${statusColors[homework.status]}`}>
					{homework.status.replace("_", " ")}
				</span>
			</div>

			<div className="space-y-6">
				<div className="bg-white rounded-xl border border-gray-200 p-6">
					<h2 className="font-semibold mb-3">Details</h2>
					<p className="text-gray-700 mb-4">{homework.description}</p>
					<div className="flex gap-8 text-sm text-gray-500">
						<span>Due: {format(new Date(homework.dueDate), "MMMM d, yyyy")}</span>
						<span>Assigned: {format(new Date(homework.createdAt), "MMMM d, yyyy")}</span>
					</div>
				</div>

				{homework.files.length > 0 && (
					<div className="bg-white rounded-xl border border-gray-200 p-6">
						<h2 className="font-semibold mb-3">Files</h2>
						<div className="space-y-2">
							{homework.files.map((file) => (
								<a key={file.id} href={file.fileUrl} target="_blank" rel="noreferrer" className="block text-sm text-primary hover:underline">
									{file.fileName}
								</a>
							))}
						</div>
					</div>
				)}

				{homework.submissions.length > 0 && (
					<div className="bg-white rounded-xl border border-gray-200 p-6">
						<h2 className="font-semibold mb-3">Submissions</h2>
						<div className="space-y-3">
							{homework.submissions.map((sub) => (
								<div key={sub.id} className="bg-gray-50 rounded-lg p-3">
									<p className="text-sm text-gray-700">{sub.content}</p>
									<p className="text-xs text-gray-400 mt-1">{format(new Date(sub.createdAt), "MMM d, h:mm a")}</p>
								</div>
							))}
						</div>
					</div>
				)}

				<div className="bg-white rounded-xl border border-gray-200 p-6">
					<h2 className="font-semibold mb-3">Submit Response</h2>
					<textarea value={submissionContent} onChange={(e) => setSubmissionContent(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Write your response..." />
					<div className="flex gap-3">
						<button type="button" onClick={handleSubmit} disabled={loading} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50">
							{loading ? "Submitting..." : "Submit"}
						</button>
						{homework.status === "submitted" && (
							<button type="button" onClick={handleMarkReviewed} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
								Mark as Reviewed
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
