"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useApi } from "@/lib/hooks";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { HomeworkAssignment } from "@therapysync/shared";

const statusColors: Record<string, string> = {
	assigned: "bg-blue-100 text-blue-800",
	in_progress: "bg-yellow-100 text-yellow-800",
	submitted: "bg-green-100 text-green-800",
	reviewed: "bg-gray-100 text-gray-800",
	overdue: "bg-red-100 text-red-800",
};

export default function HomeworkPage() {
	const api = useApi();
	const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);

	useEffect(() => {
		api.get("/homework").then(setAssignments).catch(console.error);
	}, [api]);

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Homework</h1>
				<Link href="/homework/create" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
					<Plus size={18} />
					Assign Homework
				</Link>
			</div>

			<div className="bg-white rounded-xl border border-gray-200">
				{assignments.length === 0 ? (
					<p className="p-6 text-gray-500 text-center">No homework assignments</p>
				) : (
					<div className="divide-y divide-gray-100">
						{assignments.map((hw) => (
							<Link key={hw.id} href={`/homework/${hw.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
								<div className="flex items-center justify-between mb-1">
									<h3 className="font-medium">{hw.title}</h3>
									<span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[hw.status]}`}>
										{hw.status.replace("_", " ")}
									</span>
								</div>
								<p className="text-sm text-gray-500 line-clamp-1">{hw.description}</p>
								<p className="text-xs text-gray-400 mt-1">Due: {format(new Date(hw.dueDate), "MMM d, yyyy")}</p>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
