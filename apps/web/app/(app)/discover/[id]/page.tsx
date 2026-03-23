"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { useApi } from "@/lib/hooks";
import { Star } from "lucide-react";

type TherapistProfile = {
	id: string;
	firstName: string;
	lastName: string;
	bio: string | null;
	specializations: string | null;
	city: string | null;
	phone: string | null;
	averageRating: number | null;
	totalReviews: number;
	reviews: {
		id: string;
		rating: number;
		comment: string | null;
		createdAt: string;
		client: { firstName: string; lastName: string };
	}[];
};

export default function TherapistProfilePage() {
	const { id } = useParams();
	const api = useApi();
	const [profile, setProfile] = useState<TherapistProfile | null>(null);
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [requesting, setRequesting] = useState(false);
	const [relationshipStatus, setRelationshipStatus] = useState<string | null>(null);

	useEffect(() => {
		if (id) {
			api.get(`/discover/therapists/${id}`).then(setProfile).catch(console.error);
			// Check if already connected
			api.get("/relationships").then((rels: any[]) => {
				const rel = rels.find((r) => r.therapist?.id === id);
				if (rel) setRelationshipStatus(rel.status);
			}).catch(console.error);
		}
	}, [api, id]);

	const handleSubmitReview = async () => {
		if (rating === 0) return alert("Please select a rating");
		setSubmitting(true);
		try {
			await api.post("/reviews", { therapistId: id, rating, comment: comment.trim() || undefined });
			setRating(0);
			setComment("");
			const data = await api.get(`/discover/therapists/${id}`);
			setProfile(data);
		} catch (err: any) {
			alert(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	if (!profile) {
		return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
	}

	return (
		<div className="max-w-3xl">
			{/* Header */}
			<div className="bg-white rounded-xl border border-gray-200 p-8 mb-6 text-center">
				<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold mx-auto mb-4">
					{profile.firstName[0]}{profile.lastName[0]}
				</div>
				<h1 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h1>
				{profile.city && <p className="text-gray-500 mt-1">{profile.city}</p>}
				<div className="flex items-center justify-center gap-2 mt-2">
					<Star size={20} className="text-yellow-500 fill-yellow-500" />
					<span className="text-xl font-semibold">{profile.averageRating ? profile.averageRating.toFixed(1) : "No ratings"}</span>
					<span className="text-gray-400">({profile.totalReviews} reviews)</span>
				</div>
			</div>

			{/* Request services / status */}
			<div className="mb-6">
				{relationshipStatus === "active" ? (
					<div className="w-full bg-green-50 text-green-700 py-3 rounded-lg text-center font-medium border border-green-200">
						Already Connected
					</div>
				) : relationshipStatus === "pending_approval" || relationshipStatus === "pending_invite" ? (
					<div className="w-full bg-yellow-50 text-yellow-700 py-3 rounded-lg text-center font-medium border border-yellow-200">
						Request Pending
					</div>
				) : (
					<button
						type="button"
						onClick={async () => {
							setRequesting(true);
							try {
								await api.post("/relationships/request", { therapistId: id });
								setRelationshipStatus("pending_approval");
							} catch (err: any) {
								alert(err.message);
							} finally {
								setRequesting(false);
							}
						}}
						disabled={requesting}
						className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
					>
						{requesting ? "Sending..." : "Request Services"}
					</button>
				)}
			</div>

			{/* Contact */}
			{profile.phone && (
				<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
					<h2 className="font-semibold mb-3">Contact</h2>
					<div className="flex items-center justify-between">
						<p className="text-gray-700">{profile.phone}</p>
						<a href={`tel:${profile.phone}`} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm">
							Call
						</a>
					</div>
				</div>
			)}

			{/* About */}
			{(profile.bio || profile.specializations) && (
				<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
					<h2 className="font-semibold mb-3">About</h2>
					{profile.bio && <p className="text-gray-700 mb-3">{profile.bio}</p>}
					{profile.specializations && (
						<div>
							<p className="text-sm font-medium text-gray-500 mb-1">Specializations</p>
							<p className="text-gray-700">{profile.specializations}</p>
						</div>
					)}
				</div>
			)}

			{/* Reviews */}
			{profile.reviews.length > 0 && (
				<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
					<h2 className="font-semibold mb-4">Reviews</h2>
					<div className="space-y-4">
						{profile.reviews.map((review) => (
							<div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
								<div className="flex items-center justify-between mb-1">
									<div className="flex items-center gap-1">
										{Array.from({ length: 5 }).map((_, i) => (
											<Star key={i} size={14} className={i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
										))}
									</div>
									<span className="text-xs text-gray-400">{format(new Date(review.createdAt), "MMM d, yyyy")}</span>
								</div>
								<p className="text-sm font-medium">{review.client.firstName} {review.client.lastName}</p>
								{review.comment && <p className="text-sm text-gray-600 mt-1">{review.comment}</p>}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Leave a review */}
			<div className="bg-white rounded-xl border border-gray-200 p-6">
				<h2 className="font-semibold mb-4">Leave a Review</h2>
				<div className="flex gap-2 mb-4 justify-center">
					{[1, 2, 3, 4, 5].map((star) => (
						<button key={star} type="button" onClick={() => setRating(star)}>
							<Star size={28} className={star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} />
						</button>
					))}
				</div>
				<textarea
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					rows={3}
					className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-primary focus:border-transparent"
					placeholder="Write a comment (optional)..."
				/>
				<button type="button" onClick={handleSubmitReview} disabled={submitting} className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50">
					{submitting ? "Submitting..." : "Submit Review"}
				</button>
			</div>
		</div>
	);
}
