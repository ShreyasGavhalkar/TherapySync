"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/hooks";

type Client = { id: string; client: { id: string; firstName: string; lastName: string } };

export default function CreateHomeworkPage() {
	const api = useApi();
	const router = useRouter();
	const [clients, setClients] = useState<Client[]>([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [clientId, setClientId] = useState("");
	const [dueDate, setDueDate] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		api.get("/therapist/clients").then(setClients).catch(console.error);
	}, [api]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			await api.post("/homework", {
				title,
				description,
				clientId,
				therapistId: "",
				sessionId: null,
				dueDate: new Date(dueDate).toISOString(),
			});
			router.push("/homework");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-2xl">
			<h1 className="text-2xl font-bold mb-6">Assign Homework</h1>
			<form onSubmit={handleSubmit} className="space-y-5">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
					<input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="e.g., Journaling exercise" />
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Describe the homework assignment..." />
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
					<select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary">
						<option value="">Select a client</option>
						{clients.map((c) => (
							<option key={c.client.id} value={c.client.id}>{c.client.firstName} {c.client.lastName}</option>
						))}
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
					<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary" />
				</div>

				{error && <p className="text-red-600 text-sm">{error}</p>}

				<div className="flex gap-3">
					<button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
						{loading ? "Assigning..." : "Assign Homework"}
					</button>
					<button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
				</div>
			</form>
		</div>
	);
}
