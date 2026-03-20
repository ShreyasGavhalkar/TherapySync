import { useState } from "react";
import { Alert, Platform, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addHours, parseISO, set } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import { H3, Paragraph, YStack } from "tamagui";
import { Button, Input } from "@therapysync/ui";
import { useCreateSession } from "@/hooks/useSessions";
import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { format } from "date-fns";

type ClientRelationship = {
	id: string;
	client: { id: string; firstName: string; lastName: string };
};

export default function CreateSessionScreen() {
	const { date } = useLocalSearchParams<{ date?: string }>();
	const router = useRouter();
	const role = useAuthStore((s) => s.dbUser?.role);
	const api = useApiClient();

	const initialDate = date ? parseISO(date) : new Date();
	const initialStart = set(initialDate, { hours: 10, minutes: 0, seconds: 0 });

	const [title, setTitle] = useState("");
	const [selectedClientId, setSelectedClientId] = useState("");
	const [startTime, setStartTime] = useState(initialStart);
	const [endTime, setEndTime] = useState(addHours(initialStart, 1));
	const [location, setLocation] = useState("");
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	const createSession = useCreateSession();

	// Fetch client list for therapist
	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: () => api.get<ClientRelationship[]>("/therapist/clients"),
		enabled: role === "therapist",
	});

	const handleCreate = () => {
		if (!title.trim()) {
			Alert.alert("Error", "Please enter a session title");
			return;
		}
		if (!selectedClientId) {
			Alert.alert("Error", "Please select a client");
			return;
		}

		createSession.mutate(
			{
				title: title.trim(),
				clientId: selectedClientId,
				therapistId: "", // Will be set by backend
				startTime,
				endTime,
				status: "pending",
				location: location.trim() || null,
				recurrenceRule: null,
			},
			{
				onSuccess: () => {
					router.back();
				},
				onError: (err) => {
					Alert.alert("Error", err.message);
				},
			},
		);
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
			<YStack padding="$4" gap="$4">
				<H3>New Session</H3>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Title</Paragraph>
					<Input
						placeholder="e.g., Weekly Check-in"
						value={title}
						onChangeText={setTitle}
					/>
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Client</Paragraph>
					{(clients ?? []).map((rel) => (
						<Pressable
							key={rel.client.id}
							onPress={() => setSelectedClientId(rel.client.id)}
						>
							<YStack
								padding="$3"
								borderRadius="$3"
								borderWidth={2}
								borderColor={
									selectedClientId === rel.client.id ? "$primary" : "$borderColor"
								}
								backgroundColor={
									selectedClientId === rel.client.id ? "$blue2" : "$background"
								}
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
					<Paragraph fontWeight="600">Start Time</Paragraph>
					<Pressable onPress={() => setShowStartPicker(true)}>
						<Input
							value={format(startTime, "MMM d, yyyy  h:mm a")}
							editable={false}
							pointerEvents="none"
						/>
					</Pressable>
					{showStartPicker && (
						<DateTimePicker
							value={startTime}
							mode="datetime"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, date) => {
								setShowStartPicker(Platform.OS === "ios");
								if (date) {
									setStartTime(date);
									setEndTime(addHours(date, 1));
								}
							}}
						/>
					)}
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">End Time</Paragraph>
					<Pressable onPress={() => setShowEndPicker(true)}>
						<Input
							value={format(endTime, "MMM d, yyyy  h:mm a")}
							editable={false}
							pointerEvents="none"
						/>
					</Pressable>
					{showEndPicker && (
						<DateTimePicker
							value={endTime}
							mode="datetime"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, date) => {
								setShowEndPicker(Platform.OS === "ios");
								if (date) setEndTime(date);
							}}
						/>
					)}
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Location (optional)</Paragraph>
					<Input
						placeholder="e.g., Office, Zoom link"
						value={location}
						onChangeText={setLocation}
					/>
				</YStack>

				<Button
					variant="primary"
					onPress={handleCreate}
					disabled={createSession.isPending}
					size="lg"
				>
					{createSession.isPending ? "Creating..." : "Create Session"}
				</Button>
			</YStack>
		</ScrollView>
	);
}
