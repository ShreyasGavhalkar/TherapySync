import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addHours, format, set } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import { H3, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Button, Input } from "@therapysync/ui";
import { useSessionDetail, useUpdateSession } from "@/hooks/useSessions";

export default function EditSessionScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();

	const { data: session, isLoading } = useSessionDetail(id);
	const updateSession = useUpdateSession();

	const [title, setTitle] = useState("");
	const [startTime, setStartTime] = useState(new Date());
	const [endTime, setEndTime] = useState(new Date());
	const [location, setLocation] = useState("");
	const [showStartDate, setShowStartDate] = useState(false);
	const [showStartTime, setShowStartTime] = useState(false);
	const [showEndDate, setShowEndDate] = useState(false);
	const [showEndTime, setShowEndTime] = useState(false);

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
				onSuccess: () => router.back(),
				onError: (err) => Alert.alert("Error", err.message),
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
					<Paragraph fontWeight="600">Start</Paragraph>
					<XStack gap="$2">
						<Pressable onPress={() => setShowStartDate(true)} style={{ flex: 1 }}>
							<Input
								value={format(startTime, "dd/MM/yyyy")}
								editable={false}
								pointerEvents="none"
							/>
						</Pressable>
						<Pressable onPress={() => setShowStartTime(true)} style={{ flex: 1 }}>
							<Input
								value={format(startTime, "h:mm a")}
								editable={false}
								pointerEvents="none"
							/>
						</Pressable>
					</XStack>
					{showStartDate && (
						<DateTimePicker
							value={startTime}
							mode="date"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, date) => {
								setShowStartDate(Platform.OS === "ios");
								if (date) {
									const merged = set(date, { hours: startTime.getHours(), minutes: startTime.getMinutes() });
									setStartTime(merged);
									if (merged >= endTime) setEndTime(addHours(merged, 1));
								}
							}}
						/>
					)}
					{showStartTime && (
						<DateTimePicker
							value={startTime}
							mode="time"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, date) => {
								setShowStartTime(Platform.OS === "ios");
								if (date) {
									setStartTime(date);
									if (date >= endTime) setEndTime(addHours(date, 1));
								}
							}}
						/>
					)}
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">End</Paragraph>
					<XStack gap="$2">
						<Pressable onPress={() => setShowEndDate(true)} style={{ flex: 1 }}>
							<Input
								value={format(endTime, "dd/MM/yyyy")}
								editable={false}
								pointerEvents="none"
							/>
						</Pressable>
						<Pressable onPress={() => setShowEndTime(true)} style={{ flex: 1 }}>
							<Input
								value={format(endTime, "h:mm a")}
								editable={false}
								pointerEvents="none"
							/>
						</Pressable>
					</XStack>
					{showEndDate && (
						<DateTimePicker
							value={endTime}
							mode="date"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, date) => {
								setShowEndDate(Platform.OS === "ios");
								if (date) setEndTime(set(date, { hours: endTime.getHours(), minutes: endTime.getMinutes() }));
							}}
						/>
					)}
					{showEndTime && (
						<DateTimePicker
							value={endTime}
							mode="time"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, date) => {
								setShowEndTime(Platform.OS === "ios");
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
