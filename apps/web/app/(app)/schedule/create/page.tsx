"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addHours, parseISO, set } from "date-fns";
import { useApi } from "@/lib/hooks";
import { Search, X } from "lucide-react";
import DateTimePicker from "@/components/DateTimePicker";

type Client = { id: string; client: { id: string; firstName: string; lastName: string; email: string } };

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors";

export default function CreateSessionPage() {
	const api = useApi();
	const router = useRouter();
	const searchParams = useSearchParams();
	const dateParam = searchParams.get("date");

	const now = new Date();
	const initialStart = dateParam
		? set(parseISO(dateParam), { hours: now.getHours(), minutes: now.getMinutes(), seconds: 0 })
		: now;

	const [clients, setClients] = useState<Client[]>([]);
	const [title, setTitle] = useState("");
	const [clientId, setClientId] = useState("");
	const [clientSearch, setClientSearch] = useState("");
	const [startTime, setStartTime] = useState(initialStart);
	const [endTime, setEndTime] = useState(addHours(initialStart, 1));
	const [location, setLocation] = useState("");
	const [recurrence, setRecurrence] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		api.get("/therapist/clients").then(setClients).catch(console.error);
	}, [api]);

	const filteredClients = useMemo(() => {
		if (!clientSearch.trim()) return clients;
		const q = clientSearch.toLowerCase();
		return clients.filter(
			(c) =>
				c.client.firstName.toLowerCase().includes(q) ||
				c.client.lastName.toLowerCase().includes(q) ||
				c.client.email.toLowerCase().includes(q),
		);
	}, [clients, clientSearch]);

	const selectedClient = clients.find((c) => c.client.id === clientId)?.client;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!clientId) { setError("Please select a client"); return; }
		setLoading(true);
		setError("");
		try {
			await api.post("/sessions", {
				title,
				clientId,
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				location: location || null,
				recurrenceRule: recurrence || null,
			});
			router.push("/schedule");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-2xl">
			<h1 className="text-2xl font-bold mb-6">New Session</h1>
			<form onSubmit={handleSubmit} className="space-y-5">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
					<input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} placeholder="e.g., Weekly Check-in" />
				</div>

				{/* Client selector */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
					{selectedClient ? (
						<div className="flex items-center justify-between border-2 border-primary/50 bg-primary/5 rounded-lg px-4 py-3">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
									{selectedClient.firstName[0]}{selectedClient.lastName[0]}
								</div>
								<div>
									<p className="font-medium">{selectedClient.firstName} {selectedClient.lastName}</p>
									<p className="text-xs text-gray-500">{selectedClient.email}</p>
								</div>
							</div>
							<button type="button" onClick={() => setClientId("")} className="text-gray-400 hover:text-gray-600">
								<X size={18} />
							</button>
						</div>
					) : (
						<>
							<div className="relative mb-2">
								<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
								<input
									type="text"
									value={clientSearch}
									onChange={(e) => setClientSearch(e.target.value)}
									placeholder="Search clients by name or email..."
									className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
								/>
							</div>
							<div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
								{filteredClients.length === 0 ? (
									<p className="p-3 text-sm text-gray-500 text-center">
										{clients.length === 0 ? "No clients found. Add clients first." : "No matching clients"}
									</p>
								) : (
									filteredClients.map((c) => (
										<button
											key={c.client.id}
											type="button"
											onClick={() => { setClientId(c.client.id); setClientSearch(""); }}
											className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
										>
											<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
												{c.client.firstName[0]}{c.client.lastName[0]}
											</div>
											<div className="min-w-0">
												<p className="font-medium text-sm truncate">{c.client.firstName} {c.client.lastName}</p>
												<p className="text-xs text-gray-500 truncate">{c.client.email}</p>
											</div>
										</button>
									))
								)}
							</div>
						</>
					)}
				</div>

				{/* Date/time pickers */}
				<DateTimePicker
					label="Start"
					value={startTime}
					onChange={(d) => {
						setStartTime(d);
						setEndTime(addHours(d, 1));
					}}
				/>

				<DateTimePicker
					label="End"
					value={endTime}
					onChange={setEndTime}
				/>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
					<select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className={inputClass}>
						<option value="">None</option>
						<option value="weekly">Weekly (12 sessions)</option>
						<option value="biweekly">Biweekly (12 sessions)</option>
						<option value="monthly">Monthly (6 sessions)</option>
					</select>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
					<input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="e.g., Office, Zoom link" />
				</div>

				{error && <p className="text-red-600 text-sm">{error}</p>}

				<div className="flex gap-3">
					<button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
						{loading ? "Creating..." : "Create Session"}
					</button>
					<button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
