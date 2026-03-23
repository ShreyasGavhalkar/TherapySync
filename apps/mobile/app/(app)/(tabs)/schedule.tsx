import { useCallback, useMemo, useState } from "react";
import { FlatList, Platform, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { format, parseISO, addDays, subDays, startOfDay, endOfDay } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import { H4, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "@tamagui/lucide-icons";
import { Badge, Card, Button } from "@therapysync/ui";
import { useSessions } from "@/hooks/useSessions";
import { useAuthStore } from "@/lib/auth-store";
import { useThemeColors } from "@/lib/useThemeColors";
import type { Session } from "@therapysync/shared";

const statusColors = {
	pending: "warning",
	confirmed: "success",
	cancelled: "error",
	completed: "info",
	no_show: "neutral",
} as const;

export default function ScheduleScreen() {
	const { bg, isDark } = useThemeColors();
	const router = useRouter();
	const role = useAuthStore((s) => s.dbUser?.role);
	const isTherapist = role === "therapist" || role === "admin";

	const [selectedDate, setSelectedDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);

	const from = startOfDay(selectedDate).toISOString();
	const to = endOfDay(selectedDate).toISOString();

	const { data: sessions, isLoading, refetch } = useSessions({ from, to });

	const goBack = () => setSelectedDate((d) => subDays(d, 1));
	const goForward = () => setSelectedDate((d) => addDays(d, 1));
	const goToday = () => setSelectedDate(new Date());

	const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

	const dateLabel = isToday
		? "Today"
		: format(selectedDate, "EEEE");

	const renderSession = useCallback(
		({ item }: { item: Session }) => (
			<Pressable onPress={() => router.push(`/(app)/session/${item.id}`)}>
				<Card marginBottom="$2">
					<XStack justifyContent="space-between" alignItems="center">
						<YStack flex={1}>
							<Paragraph fontWeight="600" fontSize="$5" color="$color">
								{item.title}
							</Paragraph>
							<Paragraph color="$color11" fontSize="$3" marginTop="$1">
								{format(new Date(item.startTime), "h:mm a")} — {format(new Date(item.endTime), "h:mm a")}
							</Paragraph>
							{item.location && (
								<Paragraph color="$color10" fontSize="$2" marginTop="$1">
									{item.location}
								</Paragraph>
							)}
						</YStack>
						<Badge status={statusColors[item.status]}>{item.status.replace("_", " ")}</Badge>
					</XStack>
				</Card>
			</Pressable>
		),
		[router],
	);

	return (
		<YStack flex={1} style={{ backgroundColor: bg }}>
			{/* Date header */}
			<YStack padding="$4" gap="$3">
				<XStack justifyContent="space-between" alignItems="center">
					<YStack>
						<Paragraph fontSize="$3" color="$color10" fontWeight="600">
							{dateLabel}
						</Paragraph>
						<Paragraph fontSize="$7" fontWeight="700" color="$color">
							{format(selectedDate, "d MMMM yyyy")}
						</Paragraph>
					</YStack>

					<XStack gap="$2" alignItems="center">
						<Pressable onPress={goBack}>
							<YStack padding="$2" borderRadius="$3" backgroundColor="$color3">
								<ChevronLeft size={20} color="$color" />
							</YStack>
						</Pressable>

						<Pressable onPress={() => setShowDatePicker((v) => !v)}>
							<YStack padding="$2" borderRadius="$3" backgroundColor="$color3">
								<CalendarIcon size={20} color="$blue10" />
							</YStack>
						</Pressable>

						<Pressable onPress={goForward}>
							<YStack padding="$2" borderRadius="$3" backgroundColor="$color3">
								<ChevronRight size={20} color="$color" />
							</YStack>
						</Pressable>
					</XStack>
				</XStack>

				{!isToday && (
					<Pressable onPress={goToday}>
						<Paragraph color="$blue10" fontSize="$3" fontWeight="600">
							Go to today
						</Paragraph>
					</Pressable>
				)}

				{isTherapist && (
					<Button
						variant="primary"
						onPress={() => router.push(`/(app)/session/create?date=${format(selectedDate, "yyyy-MM-dd")}`)}
						icon={<Plus size={18} color="white" />}
					>
						New Session
					</Button>
				)}
			</YStack>

			{showDatePicker && (
				<DateTimePicker
					value={selectedDate}
					mode="date"
					display={Platform.OS === "ios" ? "inline" : "default"}
					onChange={(_, date) => {
						setShowDatePicker(Platform.OS === "ios");
						if (date) setSelectedDate(date);
					}}
					themeVariant={isDark ? "dark" : "light"}
				/>
			)}

			{/* Sessions list */}
			{isLoading ? (
				<YStack flex={1} justifyContent="center" alignItems="center">
					<Spinner color="$blue10" />
				</YStack>
			) : (
				<FlatList
					data={sessions ?? []}
					keyExtractor={(item) => item.id}
					renderItem={renderSession}
					contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
					ListEmptyComponent={
						<YStack padding="$6" alignItems="center">
							<Paragraph color="$color10" fontSize="$4">
								No sessions on this day
							</Paragraph>
						</YStack>
					}
				/>
			)}
		</YStack>
	);
}
