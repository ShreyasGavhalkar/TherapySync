import { useState } from "react";
import { Alert, Linking, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import { H3, H4, Paragraph, Separator, XStack, YStack, Spinner } from "tamagui";
import { Button, Card, Input } from "@therapysync/ui";
import { useTherapistProfile, useSubmitReview } from "@/hooks/useDiscover";
import { useRequestTherapist } from "@/hooks/useClients";
import { useAuthStore } from "@/lib/auth-store";
import { Star } from "@tamagui/lucide-icons";

export default function TherapistProfileScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const role = useAuthStore((s) => s.dbUser?.role);
	const { data: profile, isLoading } = useTherapistProfile(id);
	const submitReview = useSubmitReview();
	const requestTherapist = useRequestTherapist();

	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");

	if (isLoading || !profile) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
				<Spinner size="large" color="$primary" />
			</YStack>
		);
	}

	const handleSubmitReview = () => {
		if (rating === 0) {
			Alert.alert("Error", "Please select a rating");
			return;
		}
		submitReview.mutate(
			{ therapistId: profile.id, rating, comment: comment.trim() || undefined },
			{
				onSuccess: () => {
					setRating(0);
					setComment("");
					Alert.alert("Success", "Review submitted!");
				},
				onError: (err) => Alert.alert("Error", err.message),
			},
		);
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
			<YStack padding="$4" gap="$4">
				{/* Header */}
				<YStack alignItems="center" gap="$2">
					<YStack
						width={80}
						height={80}
						borderRadius={40}
						backgroundColor="$blue5"
						alignItems="center"
						justifyContent="center"
					>
						<Paragraph fontSize="$8" fontWeight="700" color="$primary">
							{profile.firstName[0]}{profile.lastName[0]}
						</Paragraph>
					</YStack>
					<H3>{profile.firstName} {profile.lastName}</H3>
					{profile.city && <Paragraph color="$gray10">{profile.city}</Paragraph>}
					<XStack alignItems="center" gap="$1">
						<Star size={20} color="$yellow10" fill="$yellow10" />
						<Paragraph fontWeight="700" fontSize="$5">
							{profile.averageRating ? profile.averageRating.toFixed(1) : "No ratings"}
						</Paragraph>
						<Paragraph color="$gray9">({profile.totalReviews} reviews)</Paragraph>
					</XStack>
				</YStack>

				{/* Contact */}
				{profile.phone && (
					<Card>
						<YStack gap="$3">
							<H4>Contact</H4>
							<Separator />
							<XStack justifyContent="space-between" alignItems="center">
								<Paragraph color="$gray10">{profile.phone}</Paragraph>
								<Button
									variant="primary"
									size="sm"
									onPress={() => Linking.openURL(`tel:${profile.phone}`)}
								>
									Call
								</Button>
							</XStack>
						</YStack>
					</Card>
				)}

				{/* Request services */}
				{role === "client" && (
					<Button
						variant="primary"
						onPress={() => {
							requestTherapist.mutate(profile.id, {
								onSuccess: () => Alert.alert("Sent!", "Your request has been sent to the therapist."),
								onError: (err) => Alert.alert("Error", err.message),
							});
						}}
						disabled={requestTherapist.isPending}
					>
						{requestTherapist.isPending ? "Sending..." : "Request Services"}
					</Button>
				)}

				{/* Bio & Specializations */}
				{(profile.bio || profile.specializations) && (
					<Card>
						<YStack gap="$3">
							<H4>About</H4>
							<Separator />
							{profile.bio && <Paragraph>{profile.bio}</Paragraph>}
							{profile.specializations && (
								<YStack gap="$1">
									<Paragraph fontWeight="600" fontSize="$3">Specializations</Paragraph>
									<Paragraph color="$gray10">{profile.specializations}</Paragraph>
								</YStack>
							)}
						</YStack>
					</Card>
				)}

				{/* Reviews */}
				{profile.reviews.length > 0 && (
					<Card>
						<YStack gap="$3">
							<H4>Reviews</H4>
							<Separator />
							{profile.reviews.map((review) => (
								<YStack key={review.id} gap="$1" padding="$2" backgroundColor="$gray2" borderRadius="$2">
									<XStack justifyContent="space-between" alignItems="center">
										<XStack alignItems="center" gap="$1">
											{Array.from({ length: 5 }).map((_, i) => (
												<Star
													key={i}
													size={14}
													color={i < review.rating ? "$yellow10" : "$gray6"}
													fill={i < review.rating ? "$yellow10" : "transparent"}
												/>
											))}
										</XStack>
										<Paragraph color="$gray9" fontSize="$1">
											{format(new Date(review.createdAt), "MMM d, yyyy")}
										</Paragraph>
									</XStack>
									<Paragraph fontWeight="600" fontSize="$2">
										{review.client.firstName} {review.client.lastName}
									</Paragraph>
									{review.comment && <Paragraph fontSize="$3">{review.comment}</Paragraph>}
								</YStack>
							))}
						</YStack>
					</Card>
				)}

				{/* Leave a review (clients only) */}
				{role === "client" && (
					<Card>
						<YStack gap="$3">
							<H4>Leave a Review</H4>
							<Separator />
							<XStack gap="$2" justifyContent="center">
								{[1, 2, 3, 4, 5].map((star) => (
									<Pressable key={star} onPress={() => setRating(star)}>
										<Star
											size={32}
											color={star <= rating ? "$yellow10" : "$gray6"}
											fill={star <= rating ? "$yellow10" : "transparent"}
										/>
									</Pressable>
								))}
							</XStack>
							<Input
								placeholder="Write a comment (optional)..."
								value={comment}
								onChangeText={setComment}
								multiline
								numberOfLines={3}
								height={80}
								textAlignVertical="top"
							/>
							<Button
								variant="primary"
								onPress={handleSubmitReview}
								disabled={submitReview.isPending}
							>
								{submitReview.isPending ? "Submitting..." : "Submit Review"}
							</Button>
						</YStack>
					</Card>
				)}
			</YStack>
		</ScrollView>
	);
}
