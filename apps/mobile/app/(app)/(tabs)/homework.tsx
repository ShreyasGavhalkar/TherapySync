import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl } from "react-native";
import { H4, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Card, Badge } from "@therapysync/ui";
import { useApiClient } from "@/lib/api";
import type { HomeworkAssignment } from "@therapysync/shared";
import { useState } from "react";

const statusColors = {
	assigned: "info",
	in_progress: "warning",
	submitted: "success",
	reviewed: "neutral",
	overdue: "error",
} as const;

export default function HomeworkScreen() {
	const api = useApiClient();
	const [refreshing, setRefreshing] = useState(false);

	const {
		data: assignments,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["homework"],
		queryFn: () => api.get<HomeworkAssignment[]>("/homework"),
	});

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
		<YStack flex={1} backgroundColor="$background">
			<FlatList
				data={assignments ?? []}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 16, gap: 12 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				ListEmptyComponent={
					<YStack padding="$6" alignItems="center">
						<Paragraph color="$gray10">No homework assignments</Paragraph>
					</YStack>
				}
				renderItem={({ item }) => (
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
				)}
			/>
		</YStack>
	);
}
