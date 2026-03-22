import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format } from "date-fns";
import { H3, H4, Paragraph, Separator, XStack, YStack, Spinner } from "tamagui";
import { Button, Badge, Card, Input } from "@therapysync/ui";
import {
	useSessionDetail,
	useConfirmSession,
	useCancelSession,
	useCompleteSession,
	useSessionNotes,
	useCreateNote,
	useUpdateNote,
	useSignNote,
} from "@/hooks/useSessions";
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
	const isTherapist = role === "therapist" || role === "admin";

	const { data: session, isLoading } = useSessionDetail(id);
	const confirmMutation = useConfirmSession();
	const cancelMutation = useCancelSession();
	const completeMutation = useCompleteSession();

	// Notes
	const { data: note, isLoading: noteLoading } = useSessionNotes(isTherapist ? id : undefined);
	const createNote = useCreateNote();
	const updateNote = useUpdateNote();
	const signNote = useSignNote();
	const [noteContent, setNoteContent] = useState("");
	const [editingNote, setEditingNote] = useState(false);

	if (isLoading || !session) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
				<Spinner size="large" color="$primary" />
			</YStack>
		);
	}

	const canConfirm = session.status === "pending";
	const canComplete = session.status === "confirmed" && isTherapist;
	const canCancel = session.status === "pending" || session.status === "confirmed";
	const canEdit = (session.status === "pending" || session.status === "confirmed") && isTherapist;

	const handleConfirm = () => {
		Alert.alert("Confirm Session", "Are you sure?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Confirm", onPress: () => confirmMutation.mutate(session.id) },
		]);
	};

	const handleComplete = () => {
		Alert.alert("Complete Session", "Mark this session as completed?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Complete", onPress: () => completeMutation.mutate(session.id) },
		]);
	};

	const handleCancel = () => {
		Alert.prompt(
			"Cancel Session",
			"Reason (optional):",
			[
				{ text: "Back", style: "cancel" },
				{
					text: "Cancel Session",
					style: "destructive",
					onPress: (reason) => cancelMutation.mutate({ id: session.id, reason: reason ?? undefined }),
				},
			],
			"plain-text",
		);
	};

	const handleSaveNote = () => {
		if (!noteContent.trim()) {
			Alert.alert("Error", "Note content cannot be empty");
			return;
		}
		const mutation = note ? updateNote : createNote;
		mutation.mutate(
			{ sessionId: session.id, content: noteContent.trim() },
			{
				onSuccess: () => { setEditingNote(false); },
				onError: (err) => Alert.alert("Error", err.message),
			},
		);
	};

	const handleSignNote = () => {
		Alert.alert("Sign Note", "Once signed, this note cannot be edited. Continue?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign",
				onPress: () => signNote.mutate(session.id, {
					onError: (err) => Alert.alert("Error", err.message),
				}),
			},
		]);
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
							<Paragraph>{format(new Date(session.startTime), "EEEE, MMMM d, yyyy")}</Paragraph>
						</XStack>
						<XStack justifyContent="space-between">
							<Paragraph color="$gray10">Time</Paragraph>
							<Paragraph>
								{format(new Date(session.startTime), "h:mm a")} — {format(new Date(session.endTime), "h:mm a")}
							</Paragraph>
						</XStack>
						{session.location && (
							<XStack justifyContent="space-between">
								<Paragraph color="$gray10">Location</Paragraph>
								<Paragraph>{session.location}</Paragraph>
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
							<Paragraph>{session.therapist.firstName} {session.therapist.lastName}</Paragraph>
						</XStack>
						<XStack justifyContent="space-between">
							<Paragraph color="$gray10">Client</Paragraph>
							<Paragraph>{session.client.firstName} {session.client.lastName}</Paragraph>
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

				{/* Session Notes — therapist only */}
				{isTherapist && (
					<Card>
						<YStack gap="$3">
							<XStack justifyContent="space-between" alignItems="center">
								<H4>Session Notes</H4>
								{note?.isSigned && <Badge status="success">Signed</Badge>}
							</XStack>
							<Separator />

							{noteLoading ? (
								<Spinner size="small" color="$primary" />
							) : editingNote || !note ? (
								<>
									<Input
										placeholder="Write your session notes here..."
										value={noteContent || (editingNote ? note?.content : "") || ""}
										onChangeText={setNoteContent}
										multiline
										numberOfLines={6}
										height={150}
										textAlignVertical="top"
									/>
									<XStack gap="$2">
										<Button
											variant="primary"
											size="sm"
											flex={1}
											onPress={handleSaveNote}
											disabled={createNote.isPending || updateNote.isPending}
										>
											{createNote.isPending || updateNote.isPending ? "Saving..." : note ? "Update Note" : "Save Note"}
										</Button>
										{note && (
											<Button variant="ghost" size="sm" onPress={() => setEditingNote(false)}>
												Cancel
											</Button>
										)}
									</XStack>
								</>
							) : (
								<>
									<Paragraph>{note.content}</Paragraph>
									{!note.isSigned && (
										<XStack gap="$2">
											<Button
												variant="secondary"
												size="sm"
												flex={1}
												onPress={() => { setNoteContent(note.content); setEditingNote(true); }}
											>
												Edit
											</Button>
											<Button
												variant="primary"
												size="sm"
												flex={1}
												onPress={handleSignNote}
												disabled={signNote.isPending}
											>
												{signNote.isPending ? "Signing..." : "Sign & Lock"}
											</Button>
										</XStack>
									)}
									{note.signedAt && (
										<Paragraph color="$gray9" fontSize="$2">
											Signed on {format(new Date(note.signedAt), "MMM d, yyyy 'at' h:mm a")}
										</Paragraph>
									)}
								</>
							)}
						</YStack>
					</Card>
				)}

				{/* Action buttons */}
				<YStack gap="$2">
					{canConfirm && (
						<Button variant="primary" onPress={handleConfirm} disabled={confirmMutation.isPending}>
							{confirmMutation.isPending ? "Confirming..." : "Confirm Session"}
						</Button>
					)}

					{canComplete && (
						<Button variant="primary" onPress={handleComplete} disabled={completeMutation.isPending}>
							{completeMutation.isPending ? "Completing..." : "Mark as Completed"}
						</Button>
					)}

					{canEdit && (
						<Button variant="secondary" onPress={() => router.push(`/(app)/session/edit?id=${session.id}`)}>
							Reschedule / Edit
						</Button>
					)}

					{canCancel && (
						<Button variant="danger" onPress={handleCancel} disabled={cancelMutation.isPending}>
							{cancelMutation.isPending ? "Cancelling..." : "Cancel Session"}
						</Button>
					)}
				</YStack>
			</YStack>
		</ScrollView>
	);
}
