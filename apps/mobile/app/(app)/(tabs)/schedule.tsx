import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { format, parseISO, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { Calendar, type DateData } from "react-native-calendars";
import { H4, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Plus } from "@tamagui/lucide-icons";
import { Badge, Card } from "@therapysync/ui";
import { useSessions } from "@/hooks/useSessions";
import { useAuthStore } from "@/lib/auth-store";
import type { Session } from "@therapysync/shared";

const statusColors = {
	pending: "warning",
	confirmed: "success",
	cancelled: "error",
	completed: "info",
	no_show: "neutral",
} as const;

const dotColors: Record<string, string> = {
	pending: "#f59e0b",
	confirmed: "#22c55e",
	cancelled: "#ef4444",
	completed: "#3b82f6",
	no_show: "#9ca3af",
};

export default function ScheduleScreen() {
	const router = useRouter();
	const role = useAuthStore((s) => s.dbUser?.role);
	const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
	const [currentMonth, setCurrentMonth] = useState(new Date());

	const from = startOfMonth(currentMonth).toISOString();
	const to = endOfMonth(addMonths(currentMonth, 0)).toISOString();

	const { data: sessions, isLoading } = useSessions({ from, to });

	// Build marked dates for the calendar
	const markedDates = useMemo(() => {
		const marks: Record<string, { dots: Array<{ key: string; color: string }>; selected?: boolean; selectedColor?: string }> = {};

		for (const session of sessions ?? []) {
			const dateKey = format(new Date(session.startTime), "yyyy-MM-dd");
			if (!marks[dateKey]) {
				marks[dateKey] = { dots: [] };
			}
			marks[dateKey].dots.push({
				key: session.id,
				color: dotColors[session.status] ?? "#9ca3af",
			});
		}

		// Mark selected date
		if (marks[selectedDate]) {
			marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: "#6C63FF" };
		} else {
			marks[selectedDate] = { dots: [], selected: true, selectedColor: "#6C63FF" };
		}

		return marks;
	}, [sessions, selectedDate]);

	// Filter sessions for selected date
	const selectedSessions = useMemo(() => {
		return (sessions ?? []).filter((s) => {
			const dateKey = format(new Date(s.startTime), "yyyy-MM-dd");
			return dateKey === selectedDate;
		});
	}, [sessions, selectedDate]);

	const handleDayPress = useCallback((day: DateData) => {
		setSelectedDate(day.dateString);
	}, []);

	const handleMonthChange = useCallback((month: DateData) => {
		setCurrentMonth(new Date(month.dateString));
	}, []);

	const renderSession = useCallback(
		({ item }: { item: Session }) => (
			<Pressable onPress={() => router.push(`/(app)/session/${item.id}`)}>
				<Card marginBottom="$2">
					<XStack justifyContent="space-between" alignItems="center">
						<YStack flex={1}>
							<H4>{item.title}</H4>
							<Paragraph color="$gray10" fontSize="$3">
								{format(new Date(item.startTime), "h:mm a")} —{" "}
								{format(new Date(item.endTime), "h:mm a")}
							</Paragraph>
							{item.location && (
								<Paragraph color="$gray9" fontSize="$2">
									{item.location}
								</Paragraph>
							)}
						</YStack>
						<Badge status={statusColors[item.status]}>{item.status}</Badge>
					</XStack>
				</Card>
			</Pressable>
		),
		[router],
	);

	return (
		<YStack flex={1} backgroundColor="$background">
			<Calendar
				current={format(currentMonth, "yyyy-MM-dd")}
				onDayPress={handleDayPress}
				onMonthChange={handleMonthChange}
				markingType="multi-dot"
				markedDates={markedDates}
				theme={{
					todayTextColor: "#6C63FF",
					arrowColor: "#6C63FF",
					selectedDayBackgroundColor: "#6C63FF",
				}}
			/>

			<YStack flex={1} padding="$3">
				<XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
					<H4>{format(parseISO(selectedDate), "EEEE, MMM d")}</H4>
					{role !== "client" && (
						<Pressable
							onPress={() => router.push(`/(app)/session/create?date=${selectedDate}`)}
						>
							<XStack
								backgroundColor="$primary"
								paddingHorizontal="$3"
								paddingVertical="$2"
								borderRadius="$3"
								alignItems="center"
								gap="$1"
							>
								<Plus size={16} color="white" />
								<Paragraph color="white" fontSize="$3" fontWeight="600">
									New
								</Paragraph>
							</XStack>
						</Pressable>
					)}
				</XStack>

				{isLoading ? (
					<YStack flex={1} justifyContent="center" alignItems="center">
						<Spinner color="$primary" />
					</YStack>
				) : (
					<FlatList
						data={selectedSessions}
						keyExtractor={(item) => item.id}
						renderItem={renderSession}
						ListEmptyComponent={
							<YStack padding="$4" alignItems="center">
								<Paragraph color="$gray10">No sessions on this day</Paragraph>
							</YStack>
						}
					/>
				)}
			</YStack>
		</YStack>
	);
}
