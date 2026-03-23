import { FlatList, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { H4, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Card, Badge, Button } from "@therapysync/ui";
import { useHomework } from "@/hooks/useHomework";
import { useAuthStore } from "@/lib/auth-store";
import { useState } from "react";
import { useThemeColors } from "@/lib/useThemeColors";

const statusColors = {
	assigned: "info",
	in_progress: "warning",
	submitted: "success",
	reviewed: "neutral",
	overdue: "error",
} as const;

export default function HomeworkScreen() {
	const { bg } = useThemeColors();
	const router = useRouter();
	const role = useAuthStore((s) => s.dbUser?.role);
	const [refreshing, setRefreshing] = useState(false);
	const isTherapist = role === "therapist" || role === "admin";

	const { data: assignments, isLoading, refetch } = useHomework();

	const onRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	if (isLoading) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center">
				<Spinner size="large" color="$primary" />
			</YStack>
		);
	}

	return (
		<YStack flex={1} style={{ backgroundColor: bg }}>
			{isTherapist && (
				<YStack padding="$4" paddingBottom={0}>
					<Button variant="primary" onPress={() => router.push("/(app)/homework/create")}>
						Assign Homework
					</Button>
				</YStack>
			)}
			<FlatList
				data={assignments ?? []}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				ListEmptyComponent={
					<YStack padding="$6" alignItems="center">
						<Paragraph color="$gray10">No homework assignments</Paragraph>
					</YStack>
				}
				renderItem={({ item }) => (
					<Pressable onPress={() => router.push(`/(app)/homework/${item.id}`)}>
						<Card>
							<XStack justifyContent="space-between" alignItems="center">
								<H4 flex={1}>{item.title}</H4>
								<Badge status={statusColors[item.status]}>{item.status}</Badge>
							</XStack>
							<Paragraph color="$gray10" marginTop="$2" numberOfLines={2}>
								{item.description}
							</Paragraph>
							<Paragraph color="$gray9" fontSize="$3" marginTop="$1">
								Due: {new Date(item.dueDate).toLocaleDateString()}
							</Paragraph>
						</Card>
					</Pressable>
				)}
			/>
		</YStack>
	);
}
