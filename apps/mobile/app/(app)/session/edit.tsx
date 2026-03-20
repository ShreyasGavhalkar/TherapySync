import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addHours } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import { H3, Paragraph, YStack, Spinner } from "tamagui";
import { Button, Input } from "@therapysync/ui";
import { useSessionDetail, useUpdateSession } from "@/hooks/useSessions";
import { format } from "date-fns";

export default function EditSessionScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();

	const { data: session, isLoading } = useSessionDetail(id);
	const updateSession = useUpdateSession();

	const [title, setTitle] = useState("");
	const [startTime, setStartTime] = useState(new Date());
	const [endTime, setEndTime] = useState(new Date());
	const [location, setLocation] = useState("");
	const [showStartPicker, setShowStartPicker] = useState(false);
	const [showEndPicker, setShowEndPicker] = useState(false);

	useEffect(() => {
		if (session) {
			setTitle(session.title);
			setStartTime(new Date(session.startTime));
			setEndTime(new Date(session.endTime));
			setLocation(session.location ?? "");
		}
	}, [session]);

	if (isLoading || !session) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
				<Spinner size="large" color="$primary" />
			</YStack>
		);
	}

	const handleUpdate = () => {
		if (!title.trim()) {
			Alert.alert("Error", "Please enter a session title");
			return;
		}

		updateSession.mutate(
			{
				id: session.id,
				data: {
					title: title.trim(),
					startTime,
					endTime,
					location: location.trim() || null,
				},
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
				<H3>Edit Session</H3>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Title</Paragraph>
					<Input value={title} onChangeText={setTitle} />
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
									if (date >= endTime) {
										setEndTime(addHours(date, 1));
									}
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
					<Input value={location} onChangeText={setLocation} />
				</YStack>

				<Button
					variant="primary"
					onPress={handleUpdate}
					disabled={updateSession.isPending}
					size="lg"
				>
					{updateSession.isPending ? "Saving..." : "Save Changes"}
				</Button>

				<Button variant="ghost" onPress={() => router.back()}>
					Cancel
				</Button>
			</YStack>
		</ScrollView>
	);
}
