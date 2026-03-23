import { useMemo, useState } from "react";
import { Alert, Platform, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addHours, parseISO, set, format } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import { H3, Paragraph, XStack, YStack } from "tamagui";
import { Button, Input } from "@therapysync/ui";
import { useCreateSession } from "@/hooks/useSessions";
import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";
import { Check } from "@tamagui/lucide-icons";
import { useThemeColors } from "@/lib/useThemeColors";

type ClientRelationship = {
	id: string;
	client: { id: string; firstName: string; lastName: string; email: string };
};

function formatDate(d: Date) {
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
}

export default function CreateSessionScreen() {
	const { bg } = useThemeColors();
	const { date } = useLocalSearchParams<{ date?: string }>();
	const router = useRouter();
	const role = useAuthStore((s) => s.dbUser?.role);
	const api = useApiClient();

	const now = new Date();
	const initialStart = date
		? set(parseISO(date), { hours: now.getHours(), minutes: now.getMinutes(), seconds: 0 })
		: now;

	const [title, setTitle] = useState("");
	const [selectedClientId, setSelectedClientId] = useState("");
	const [clientSearch, setClientSearch] = useState("");
	const [startTime, setStartTime] = useState(initialStart);
	const [endTime, setEndTime] = useState(addHours(initialStart, 1));
	const [location, setLocation] = useState("");
	const [showStartDate, setShowStartDate] = useState(false);
	const [showStartTime, setShowStartTime] = useState(false);
	const [showEndDate, setShowEndDate] = useState(false);
	const [showEndTime, setShowEndTime] = useState(false);
	const [recurrence, setRecurrence] = useState<string | null>(null);
	const [recurrenceCount, setRecurrenceCount] = useState("12");
	const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);

	const createSession = useCreateSession();

	const { data: clients } = useQuery({
		queryKey: ["clients"],
		queryFn: () => api.get<ClientRelationship[]>("/therapist/clients"),
		enabled: role === "therapist",
	});

	const filteredClients = useMemo(() => {
		const all = clients ?? [];
		if (!clientSearch.trim()) return all;
		const q = clientSearch.toLowerCase();
		return all.filter(
			(r) =>
				r.client.firstName.toLowerCase().includes(q) ||
				r.client.lastName.toLowerCase().includes(q) ||
				r.client.email.toLowerCase().includes(q),
		);
	}, [clients, clientSearch]);

	const selectedClient = clients?.find((r) => r.client.id === selectedClientId)?.client;

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
				therapistId: "",
				startTime,
				endTime,
				status: "pending",
				location: location.trim() || null,
				recurrenceRule: recurrence ? `${recurrence}:${recurrenceCount}` : null,
			},
			{
				onSuccess: () => router.back(),
				onError: (err) => Alert.alert("Error", err.message),
			},
		);
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: bg }}>
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

				{/* Client selector */}
				<YStack gap="$2">
					<Paragraph fontWeight="600">Client</Paragraph>
					{selectedClient ? (
						<Pressable onPress={() => setSelectedClientId("")}>
							<XStack
								padding="$3"
								borderRadius="$3"
								borderWidth={2}
								borderColor="$blue8"
								backgroundColor="$blue2"
								alignItems="center"
								justifyContent="space-between"
							>
								<YStack>
									<Paragraph fontWeight="600" color="$blue10">
										{selectedClient.firstName} {selectedClient.lastName}
									</Paragraph>
									<Paragraph fontSize="$2" color="$gray9">{selectedClient.email}</Paragraph>
								</YStack>
								<Check size={20} color="$blue10" />
							</XStack>
						</Pressable>
					) : (
						<>
							<Input
								placeholder="Search clients..."
								value={clientSearch}
								onChangeText={setClientSearch}
							/>
							<YStack gap="$1" maxHeight={200}>
								{filteredClients.length === 0 ? (
									<Paragraph color="$gray10" fontSize="$3" padding="$2">
										{(clients ?? []).length === 0
											? "No clients found. Add clients first."
											: "No matching clients"}
									</Paragraph>
								) : (
									filteredClients.map((rel) => (
										<Pressable
											key={rel.client.id}
											onPress={() => {
												setSelectedClientId(rel.client.id);
												setClientSearch("");
											}}
										>
											<XStack
												padding="$3"
												borderRadius="$3"
												backgroundColor="$gray2"
												alignItems="center"
												gap="$3"
											>
												<YStack
													width={36}
													height={36}
													borderRadius={18}
													backgroundColor="$blue5"
													alignItems="center"
													justifyContent="center"
												>
													<Paragraph fontSize="$3" fontWeight="700" color="$blue10">
														{rel.client.firstName[0]}{rel.client.lastName[0]}
													</Paragraph>
												</YStack>
												<YStack flex={1}>
													<Paragraph fontWeight="600" fontSize="$4">
														{rel.client.firstName} {rel.client.lastName}
													</Paragraph>
													<Paragraph fontSize="$2" color="$gray9">
														{rel.client.email}
													</Paragraph>
												</YStack>
											</XStack>
										</Pressable>
									))
								)}
							</YStack>
						</>
					)}
				</YStack>

				{/* Start date/time */}
				<YStack gap="$2">
					<Paragraph fontWeight="600">Start</Paragraph>
					<XStack gap="$2">
						<Pressable onPress={() => setShowStartDate(true)} style={{ flex: 1 }}>
							<Input
								value={formatDate(startTime)}
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
							onChange={(_, d) => {
								setShowStartDate(Platform.OS === "ios");
								if (d) {
									const merged = set(d, { hours: startTime.getHours(), minutes: startTime.getMinutes() });
									setStartTime(merged);
									setEndTime(addHours(merged, 1));
								}
							}}
						/>
					)}
					{showStartTime && (
						<DateTimePicker
							value={startTime}
							mode="time"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, d) => {
								setShowStartTime(Platform.OS === "ios");
								if (d) {
									setStartTime(d);
									setEndTime(addHours(d, 1));
								}
							}}
						/>
					)}
				</YStack>

				{/* End date/time */}
				<YStack gap="$2">
					<Paragraph fontWeight="600">End</Paragraph>
					<XStack gap="$2">
						<Pressable onPress={() => setShowEndDate(true)} style={{ flex: 1 }}>
							<Input
								value={formatDate(endTime)}
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
							onChange={(_, d) => {
								setShowEndDate(Platform.OS === "ios");
								if (d) setEndTime(set(d, { hours: endTime.getHours(), minutes: endTime.getMinutes() }));
							}}
						/>
					)}
					{showEndTime && (
						<DateTimePicker
							value={endTime}
							mode="time"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, d) => {
								setShowEndTime(Platform.OS === "ios");
								if (d) setEndTime(d);
							}}
						/>
					)}
				</YStack>

				{/* Recurrence */}
				<YStack gap="$2">
					<Paragraph fontWeight="600">Repeat</Paragraph>
					<Pressable onPress={() => setShowRecurrencePicker((v) => !v)}>
						<XStack
							padding="$3"
							borderRadius="$3"
							backgroundColor="$color2"
							justifyContent="space-between"
							alignItems="center"
						>
							<Paragraph color="$color">
								{recurrence
									? recurrence === "daily"
										? `Every day, ${recurrenceCount} times`
										: recurrence === "weekly"
											? `Every ${format(startTime, "EEEE")}, ${recurrenceCount} times`
											: recurrence === "biweekly"
												? `Every 2 weeks on ${format(startTime, "EEEE")}, ${recurrenceCount} times`
												: `Monthly on the ${format(startTime, "do")}, ${recurrenceCount} times`
									: "Does not repeat"}
							</Paragraph>
							<Paragraph color="$color10" fontSize="$2">Change</Paragraph>
						</XStack>
					</Pressable>

					{showRecurrencePicker && (
						<YStack backgroundColor="$color2" borderRadius="$4" padding="$3" gap="$1">
							{[
								{ value: null, label: "Does not repeat" },
								{ value: "daily", label: "Every day" },
								{ value: "weekly", label: `Every week on ${format(startTime, "EEEE")}` },
								{ value: "biweekly", label: `Every 2 weeks on ${format(startTime, "EEEE")}` },
								{ value: "monthly", label: `Monthly on the ${format(startTime, "do")}` },
							].map((opt) => (
								<Pressable
									key={opt.label}
									onPress={() => {
										setRecurrence(opt.value);
										if (!opt.value) setShowRecurrencePicker(false);
									}}
								>
									<XStack
										padding="$3"
										borderRadius="$3"
										backgroundColor={recurrence === opt.value ? "$blue3" : "transparent"}
										alignItems="center"
										gap="$2"
									>
										<YStack
											width={20}
											height={20}
											borderRadius={10}
											borderWidth={2}
											borderColor={recurrence === opt.value ? "$blue10" : "$color8"}
											backgroundColor={recurrence === opt.value ? "$blue10" : "transparent"}
										/>
										<Paragraph
											color={recurrence === opt.value ? "$blue11" : "$color"}
											fontWeight={recurrence === opt.value ? "600" : "400"}
										>
											{opt.label}
										</Paragraph>
									</XStack>
								</Pressable>
							))}

							{recurrence && (
								<YStack padding="$3" gap="$2">
									<Paragraph color="$color11" fontSize="$3" fontWeight="600">
										Number of sessions
									</Paragraph>
									<XStack alignItems="center" gap="$3">
										<Pressable onPress={() => setRecurrenceCount((c) => String(Math.max(2, Number(c) - 1)))}>
											<YStack width={36} height={36} borderRadius={18} backgroundColor="$color4" alignItems="center" justifyContent="center">
												<Paragraph fontWeight="700" fontSize="$5" color="$color">−</Paragraph>
											</YStack>
										</Pressable>
										<Paragraph fontSize="$6" fontWeight="700" color="$color" minWidth={40} textAlign="center">
											{recurrenceCount}
										</Paragraph>
										<Pressable onPress={() => setRecurrenceCount((c) => String(Math.min(52, Number(c) + 1)))}>
											<YStack width={36} height={36} borderRadius={18} backgroundColor="$color4" alignItems="center" justifyContent="center">
												<Paragraph fontWeight="700" fontSize="$5" color="$color">+</Paragraph>
											</YStack>
										</Pressable>
									</XStack>
								</YStack>
							)}

							<Pressable onPress={() => setShowRecurrencePicker(false)}>
								<YStack padding="$2" alignItems="center">
									<Paragraph color="$blue10" fontWeight="600">Done</Paragraph>
								</YStack>
							</Pressable>
						</YStack>
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
