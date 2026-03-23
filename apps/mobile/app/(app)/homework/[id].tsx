import { useState } from "react";
import { Alert, Linking, Platform, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import * as DocumentPicker from "expo-document-picker";
import { H3, H4, Paragraph, Separator, XStack, YStack, Spinner } from "tamagui";
import { Button, Badge, Card, Input } from "@therapysync/ui";
import { useHomeworkDetail, useSubmitHomework, useUpdateHomework } from "@/hooks/useHomework";
import { useAuthStore } from "@/lib/auth-store";
import { useUploadFile } from "@/hooks/useFiles";
import { useThemeColors } from "@/lib/useThemeColors";

const statusColors = {
	assigned: "info",
	in_progress: "warning",
	submitted: "success",
	reviewed: "neutral",
	overdue: "error",
} as const;

export default function HomeworkDetailScreen() {
	const { bg } = useThemeColors();
	const { id } = useLocalSearchParams<{ id: string }>();
	const role = useAuthStore((s) => s.dbUser?.role);
	const { data: homework, isLoading } = useHomeworkDetail(id);
	const submitMutation = useSubmitHomework();
	const updateMutation = useUpdateHomework();
	const uploadFile = useUploadFile();

	const [submissionContent, setSubmissionContent] = useState("");

	if (isLoading || !homework) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
				<Spinner size="large" color="$primary" />
			</YStack>
		);
	}

	const isTherapist = role === "therapist" || role === "admin";
	const canSubmit = !isTherapist && (homework.status === "assigned" || homework.status === "in_progress");
	const canReview = isTherapist && homework.status === "submitted";

	const handleSubmit = () => {
		if (!submissionContent.trim()) {
			Alert.alert("Error", "Please enter your response");
			return;
		}
		submitMutation.mutate(
			{ assignmentId: homework.id, content: submissionContent.trim() },
			{
				onSuccess: () => {
					setSubmissionContent("");
					Alert.alert("Success", "Homework submitted!");
				},
				onError: (err) => Alert.alert("Error", err.message),
			},
		);
	};

	const handlePickFile = async () => {
		if (Platform.OS === "web") {
			Alert.alert("Not supported", "File upload is not supported on web yet");
			return;
		}
		const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
		if (result.canceled || !result.assets?.[0]) return;

		const asset = result.assets[0];
		uploadFile.mutate(
			{ uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/octet-stream", assignmentId: homework.id },
			{
				onSuccess: () => Alert.alert("Success", "File uploaded!"),
				onError: (err) => Alert.alert("Error", err.message),
			},
		);
	};

	const handleMarkReviewed = () => {
		updateMutation.mutate(
			{ id: homework.id, data: { status: "reviewed" } },
			{
				onSuccess: () => Alert.alert("Success", "Marked as reviewed"),
				onError: (err) => Alert.alert("Error", err.message),
			},
		);
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: bg }}>
			<YStack padding="$4" gap="$4">
				<XStack justifyContent="space-between" alignItems="center">
					<H3 flex={1}>{homework.title}</H3>
					<Badge status={statusColors[homework.status]}>{homework.status}</Badge>
				</XStack>

				<Card>
					<YStack gap="$3">
						<H4>Details</H4>
						<Separator />
						<Paragraph>{homework.description}</Paragraph>
						<XStack justifyContent="space-between">
							<Paragraph color="$gray10">Due Date</Paragraph>
							<Paragraph>{format(new Date(homework.dueDate), "MMMM d, yyyy")}</Paragraph>
						</XStack>
						<XStack justifyContent="space-between">
							<Paragraph color="$gray10">Assigned</Paragraph>
							<Paragraph>{format(new Date(homework.createdAt), "MMMM d, yyyy")}</Paragraph>
						</XStack>
					</YStack>
				</Card>

				{homework.files.length > 0 && (
					<Card>
						<YStack gap="$3">
							<H4>Files</H4>
							<Separator />
							{homework.files.map((file) => (
								<XStack
									key={file.id}
									justifyContent="space-between"
									alignItems="center"
									padding="$2"
									backgroundColor="$gray2"
									borderRadius="$2"
								>
									<Paragraph flex={1} numberOfLines={1}>{file.fileName}</Paragraph>
									<Button
										variant="ghost"
										size="sm"
										onPress={() => Linking.openURL(file.fileUrl)}
									>
										View
									</Button>
								</XStack>
							))}
						</YStack>
					</Card>
				)}

				{homework.submissions.length > 0 && (
					<Card>
						<YStack gap="$3">
							<H4>Submissions</H4>
							<Separator />
							{homework.submissions.map((sub) => (
								<YStack key={sub.id} gap="$1" padding="$2" backgroundColor="$gray2" borderRadius="$2">
									<XStack justifyContent="space-between">
										<Paragraph fontWeight="600">
											{sub.submitter.firstName} {sub.submitter.lastName}
										</Paragraph>
										<Paragraph color="$gray9" fontSize="$2">
											{format(new Date(sub.createdAt), "MMM d, h:mm a")}
										</Paragraph>
									</XStack>
									<Paragraph>{sub.content}</Paragraph>
								</YStack>
							))}
						</YStack>
					</Card>
				)}

				{canSubmit && (
					<Card>
						<YStack gap="$3">
							<H4>Your Response</H4>
							<Separator />
							<Input
								placeholder="Write your response here..."
								value={submissionContent}
								onChangeText={setSubmissionContent}
								multiline
								numberOfLines={4}
								height={120}
								textAlignVertical="top"
							/>
							<XStack gap="$2">
								<Button
									variant="secondary"
									onPress={handlePickFile}
									disabled={uploadFile.isPending}
									flex={1}
								>
									{uploadFile.isPending ? "Uploading..." : "Attach File"}
								</Button>
								<Button
									variant="primary"
									onPress={handleSubmit}
									disabled={submitMutation.isPending}
									flex={1}
								>
									{submitMutation.isPending ? "Submitting..." : "Submit"}
								</Button>
							</XStack>
						</YStack>
					</Card>
				)}

				{canReview && (
					<Button
						variant="primary"
						onPress={handleMarkReviewed}
						disabled={updateMutation.isPending}
					>
						{updateMutation.isPending ? "Updating..." : "Mark as Reviewed"}
					</Button>
				)}
			</YStack>
		</ScrollView>
	);
}
