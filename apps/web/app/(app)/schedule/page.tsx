"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { useApi } from "@/lib/hooks";
import { useUser } from "@/lib/user-context";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Session } from "@therapysync/shared";
import Link from "next/link";

const statusColors: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800",
	confirmed: "bg-green-100 text-green-800",
	cancelled: "bg-red-100 text-red-800",
	completed: "bg-blue-100 text-blue-800",
	no_show: "bg-gray-100 text-gray-800",
};

export default function SchedulePage() {
	const api = useApi();
	const user = useUser();
	const isTherapist = user?.role === "therapist" || user?.role === "admin";
	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [sessions, setSessions] = useState<Session[]>([]);
	const [selectedDate, setSelectedDate] = useState(new Date());

	const fetchSessions = useCallback(async () => {
		const from = startOfMonth(currentMonth).toISOString();
		const to = endOfMonth(currentMonth).toISOString();
		const data = await api.get(`/sessions?from=${from}&to=${to}`);
		setSessions(data);
	}, [api, currentMonth]);

	useEffect(() => {
		fetchSessions().catch(console.error);
	}, [fetchSessions]);

	const days = eachDayOfInterval({
		start: startOfMonth(currentMonth),
		end: endOfMonth(currentMonth),
	});

	const sessionsOnDate = sessions.filter((s) => isSameDay(new Date(s.startTime), selectedDate));
	const firstDayOffset = startOfMonth(currentMonth).getDay();

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Schedule</h1>
				{isTherapist && (
					<Link
						href={`/schedule/create?date=${format(selectedDate, "yyyy-MM-dd")}`}
						className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
					>
						<Plus size={18} />
						New Session
					</Link>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Calendar */}
				<div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
					<div className="flex items-center justify-between mb-4">
						<button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
							<ChevronLeft size={20} />
						</button>
						<h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
						<button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
							<ChevronRight size={20} />
						</button>
					</div>

					<div className="grid grid-cols-7 gap-1">
						{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
							<div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
						))}
						{Array.from({ length: firstDayOffset }).map((_, i) => (
							<div key={`empty-${i}`} />
						))}
						{days.map((day) => {
							const daySessions = sessions.filter((s) => isSameDay(new Date(s.startTime), day));
							const isSelected = isSameDay(day, selectedDate);
							const isToday = isSameDay(day, new Date());
							return (
								<button
									type="button"
									key={day.toISOString()}
									onClick={() => setSelectedDate(day)}
									className={`p-2 rounded-lg text-sm relative transition-colors ${
										isSelected ? "bg-primary text-white" : isToday ? "bg-primary/10" : "hover:bg-gray-100"
									}`}
								>
									{format(day, "d")}
									{daySessions.length > 0 && (
										<span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-primary"}`} />
									)}
								</button>
							);
						})}
					</div>
				</div>

				{/* Sessions for selected date */}
				<div className="bg-white rounded-xl border border-gray-200 p-6">
					<h3 className="font-semibold mb-4">{format(selectedDate, "EEEE, MMM d")}</h3>
					{sessionsOnDate.length === 0 ? (
						<p className="text-gray-500 text-sm">No sessions on this day</p>
					) : (
						<div className="space-y-3">
							{sessionsOnDate.map((session) => (
								<Link key={session.id} href={`/schedule/${session.id}`} className="block border border-gray-200 rounded-lg p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
									<div className="flex items-center justify-between mb-1">
										<p className="font-medium text-sm">{session.title}</p>
										<span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[session.status]}`}>
											{session.status}
										</span>
									</div>
									<p className="text-xs text-gray-500">
										{format(new Date(session.startTime), "h:mm a")} — {format(new Date(session.endTime), "h:mm a")}
									</p>
									{session.location && (
										<p className="text-xs text-gray-400 mt-1">{session.location}</p>
									)}
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
