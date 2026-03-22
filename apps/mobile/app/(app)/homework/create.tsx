import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { addDays, format } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import { H3, Paragraph, YStack } from "tamagui";
import { Button, Input } from "@therapysync/ui";
import { useCreateHomework } from "@/hooks/useHomework";
import { useClients } from "@/hooks/useClients";
import { useAuthStore } from "@/lib/auth-store";

export default function CreateHomeworkScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.dbUser?.id);
	const { data: clients } = useClients();
	const createHomework = useCreateHomework();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedClientId, setSelectedClientId] = useState("");
	const [dueDate, setDueDate] = useState(addDays(new Date(), 7));
	const [showDatePicker, setShowDatePicker] = useState(false);

	const handleCreate = () => {
		if (!title.trim()) {
			Alert.alert("Error", "Please enter a title");
			return;
		}
		if (!selectedClientId) {
			Alert.alert("Error", "Please select a client");
			return;
		}
		if (!description.trim()) {
			Alert.alert("Error", "Please enter a description");
			return;
		}

		createHomework.mutate(
			{
				therapistId: userId ?? "",
				clientId: selectedClientId,
				sessionId: null,
				title: title.trim(),
				description: description.trim(),
				dueDate,
			},
			{
				onSuccess: () => router.back(),
				onError: (err) => Alert.alert("Error", err.message),
			},
		);
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
			<YStack padding="$4" gap="$4">
				<H3>Assign Homework</H3>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Title</Paragraph>
					<Input placeholder="e.g., Journaling exercise" value={title} onChangeText={setTitle} />
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Description</Paragraph>
					<Input
						placeholder="Describe the homework assignment..."
						value={description}
						onChangeText={setDescription}
						multiline
						numberOfLines={4}
						height={120}
						textAlignVertical="top"
					/>
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Client</Paragraph>
					{(clients ?? []).map((rel) => (
						<Pressable key={rel.client.id} onPress={() => setSelectedClientId(rel.client.id)}>
							<YStack
								padding="$3"
								borderRadius="$3"
								borderWidth={2}
								borderColor={selectedClientId === rel.client.id ? "$primary" : "$borderColor"}
								backgroundColor={selectedClientId === rel.client.id ? "$blue2" : "$background"}
							>
								<Paragraph>
									{rel.client.firstName} {rel.client.lastName}
								</Paragraph>
							</YStack>
						</Pressable>
					))}
					{(clients ?? []).length === 0 && (
						<Paragraph color="$gray10" fontSize="$3">
							No clients found. Add clients first.
						</Paragraph>
					)}
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Due Date</Paragraph>
					<Pressable onPress={() => setShowDatePicker(true)}>
						<Input
							value={format(dueDate, "MMMM d, yyyy")}
							editable={false}
							pointerEvents="none"
						/>
					</Pressable>
					{showDatePicker && (
						<DateTimePicker
							value={dueDate}
							mode="date"
							minimumDate={new Date()}
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, date) => {
								setShowDatePicker(Platform.OS === "ios");
								if (date) setDueDate(date);
							}}
						/>
					)}
				</YStack>

				<Button
					variant="primary"
					onPress={handleCreate}
					disabled={createHomework.isPending}
					size="lg"
				>
					{createHomework.isPending ? "Assigning..." : "Assign Homework"}
				</Button>
			</YStack>
		</ScrollView>
	);
}
