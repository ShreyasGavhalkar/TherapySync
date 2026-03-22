"use client";

import { useEffect, useRef, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, setHours, setMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";

type Props = {
	label: string;
	value: Date;
	onChange: (date: Date) => void;
};

export default function DateTimePicker({ label, value, onChange }: Props) {
	const [showCalendar, setShowCalendar] = useState(false);
	const [showTime, setShowTime] = useState(false);
	const [viewMonth, setViewMonth] = useState(startOfMonth(value));
	const calRef = useRef<HTMLDivElement>(null);
	const timeRef = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false);
			if (timeRef.current && !timeRef.current.contains(e.target as Node)) setShowTime(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
	const firstDayOffset = startOfMonth(viewMonth).getDay();

	const pad = (n: number) => String(n).padStart(2, "0");
	const displayDate = `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
	const displayTime = format(value, "h:mm a");

	const hours = Array.from({ length: 24 }, (_, i) => i);
	const minutes = [0, 15, 30, 45];

	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
			<div className="grid grid-cols-2 gap-3">
				{/* Date field */}
				<div className="relative" ref={calRef}>
					<button
						type="button"
						onClick={() => { setShowCalendar(!showCalendar); setShowTime(false); }}
						className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 text-left hover:border-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
					>
						<Calendar size={16} className="text-gray-400 shrink-0" />
						<span>{displayDate}</span>
					</button>

					{showCalendar && (
						<div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72">
							<div className="flex items-center justify-between mb-3">
								<button type="button" onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
									<ChevronLeft size={18} />
								</button>
								<span className="text-sm font-semibold">{format(viewMonth, "MMMM yyyy")}</span>
								<button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
									<ChevronRight size={18} />
								</button>
							</div>
							<div className="grid grid-cols-7 gap-0.5 text-center">
								{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
									<div key={d} className="text-xs text-gray-400 py-1">{d}</div>
								))}
								{Array.from({ length: firstDayOffset }).map((_, i) => (
									<div key={`e-${i}`} />
								))}
								{days.map((day) => {
									const selected = isSameDay(day, value);
									const today = isSameDay(day, new Date());
									return (
										<button
											key={day.toISOString()}
											type="button"
											onClick={() => {
												const merged = setMinutes(setHours(day, value.getHours()), value.getMinutes());
												onChange(merged);
												setShowCalendar(false);
											}}
											className={`w-9 h-9 rounded-lg text-sm transition-colors ${
												selected
													? "bg-primary text-white"
													: today
														? "bg-primary/10 text-primary font-medium"
														: "hover:bg-gray-100"
											}`}
										>
											{format(day, "d")}
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>

				{/* Time field */}
				<div className="relative" ref={timeRef}>
					<button
						type="button"
						onClick={() => { setShowTime(!showTime); setShowCalendar(false); }}
						className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 text-left hover:border-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors"
					>
						<Clock size={16} className="text-gray-400 shrink-0" />
						<span>{displayTime}</span>
					</button>

					{showTime && (
						<div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-48 max-h-64 overflow-y-auto">
							{hours.map((h) =>
								minutes.map((m) => {
									const d = setMinutes(setHours(new Date(value), h), m);
									const label = format(d, "h:mm a");
									const isSelected = value.getHours() === h && value.getMinutes() === m;
									return (
										<button
											key={`${h}-${m}`}
											type="button"
											onClick={() => {
												onChange(setMinutes(setHours(new Date(value), h), m));
												setShowTime(false);
											}}
											className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
												isSelected ? "bg-primary text-white" : "hover:bg-gray-100"
											}`}
										>
											{label}
										</button>
									);
								}),
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
