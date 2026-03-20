import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format } from "date-fns";
import { H3, H4, Paragraph, Separator, XStack, YStack, Spinner } from "tamagui";
import { Button, Badge, Card } from "@therapysync/ui";
import { useSessionDetail, useConfirmSession, useCancelSession } from "@/hooks/useSessions";
import { useAuthStore } from "@/lib/auth-store";

const statusColors = {
	pending: "warning",
	confirmed: "success",
	cancelled: "error",
	completed: "info",
	no_show: "neutral",
} as const;

export default function SessionDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const role = useAuthStore((s) => s.dbUser?.role);
	const userId = useAuthStore((s) => s.dbUser?.id);

	const { data: session, isLoading } = useSessionDetail(id);
	const confirmMutation = useConfirmSession();
	const cancelMutation = useCancelSession();

	const [cancelReason, setCancelReason] = useState("");

	if (isLoading || !session) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
				<Spinner size="large" color="$primary" />
			</YStack>
		);
	}

	const canConfirm = session.status === "pending";
	const canCancel = session.status === "pending" || session.status === "confirmed";
	const canEdit =
		(session.status === "pending" || session.status === "confirmed") &&
		(role === "admin" || role === "therapist");

	const handleConfirm = () => {
		Alert.alert("Confirm Session", "Are you sure you want to confirm this session?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Confirm",
				onPress: () => confirmMutation.mutate(session.id),
			},
		]);
	};

	const handleCancel = () => {
		Alert.prompt(
			"Cancel Session",
			"Please provide a reason (optional):",
			[
				{ text: "Back", style: "cancel" },
				{
					text: "Cancel Session",
					style: "destructive",
					onPress: (reason) => {
						cancelMutation.mutate({ id: session.id, reason: reason ?? undefined });
					},
				},
			],
			"plain-text",
		);
	};

	const handleEdit = () => {
		router.push(`/(app)/session/edit?id=${session.id}`);
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
			<YStack padding="$4" gap="$4">
				<XStack justifyContent="space-between" alignItems="center">
					<H3 flex={1}>{session.title}</H3>
					<Badge status={statusColors[session.status]}>{session.status}</Badge>
				</XStack>

				<Card>
					<YStack gap="$3">
						<H4>Details</H4>
						<Separator />
						<XStack justifyContent="space-between">
							<Paragraph color="$gray10">Date</Paragraph>
							<Paragraph>
								{format(new Date(session.startTime), "EEEE, MMMM d, yyyy")}
							</Paragraph>
						</XStack>
						<XStack justifyContent="space-between">
							<Paragraph color="$gray10">Time</Paragraph>
							<Paragraph>
								{format(new Date(session.startTime), "h:mm a")} —{" "}
								{format(new Date(session.endTime), "h:mm a")}
							</Paragraph>
						</XStack>
						{session.location && (
							<XStack justifyContent="space-between">
								<Paragraph color="$gray10">Location</Paragraph>
								<Paragraph>{session.location}</Paragraph>
							</XStack>
						)}
						{session.recurrenceRule && (
							<XStack justifyContent="space-between">
								<Paragraph color="$gray10">Recurrence</Paragraph>
								<Paragraph>{session.recurrenceRule}</Paragraph>
							</XStack>
						)}
					</YStack>
				</Card>

				<Card>
					<YStack gap="$3">
						<H4>Participants</H4>
						<Separator />
						<XStack justifyContent="space-between">
							<Paragraph color="$gray10">Therapist</Paragraph>
							<Paragraph>
								{session.therapist.firstName} {session.therapist.lastName}
							</Paragraph>
						</XStack>
						<XStack justifyContent="space-between">
							<Paragraph color="$gray10">Client</Paragraph>
							<Paragraph>
								{session.client.firstName} {session.client.lastName}
							</Paragraph>
						</XStack>
					</YStack>
				</Card>

				{session.status === "cancelled" && session.cancelReason && (
					<Card>
						<YStack gap="$2">
							<H4>Cancellation</H4>
							<Separator />
							<Paragraph color="$gray10">Reason: {session.cancelReason}</Paragraph>
						</YStack>
					</Card>
				)}

				<YStack gap="$2">
					{canConfirm && (
						<Button
							variant="primary"
							onPress={handleConfirm}
							disabled={confirmMutation.isPending}
						>
							{confirmMutation.isPending ? "Confirming..." : "Confirm Session"}
						</Button>
					)}

					{canEdit && (
						<Button variant="secondary" onPress={handleEdit}>
							Reschedule / Edit
						</Button>
					)}

					{canCancel && (
						<Button
							variant="danger"
							onPress={handleCancel}
							disabled={cancelMutation.isPending}
						>
							{cancelMutation.isPending ? "Cancelling..." : "Cancel Session"}
						</Button>
					)}
				</YStack>
			</YStack>
		</ScrollView>
	);
}
