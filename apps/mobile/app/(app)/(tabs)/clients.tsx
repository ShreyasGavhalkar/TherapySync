import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl } from "react-native";
import { H4, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Card, Badge } from "@therapysync/ui";
import { useApiClient } from "@/lib/api";
import { useState } from "react";

type ClientRelationship = {
	id: string;
	status: string;
	startedAt: string | null;
	client: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		phone: string | null;
		avatarUrl: string | null;
	};
};

const statusColors = {
	active: "success",
	archived: "neutral",
	pending_invite: "warning",
} as const;

export default function ClientsScreen() {
	const api = useApiClient();
	const [refreshing, setRefreshing] = useState(false);

	const {
		data: clients,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["clients"],
		queryFn: () => api.get<ClientRelationship[]>("/therapist/clients"),
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
				data={clients ?? []}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 16, gap: 12 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				ListEmptyComponent={
					<YStack padding="$6" alignItems="center">
						<Paragraph color="$gray10">No clients yet</Paragraph>
					</YStack>
				}
				renderItem={({ item }) => (
					<Card>
						<XStack justifyContent="space-between" alignItems="center">
							<YStack>
								<H4>
									{item.client.firstName} {item.client.lastName}
								</H4>
								<Paragraph color="$gray10" fontSize="$3">
									{item.client.email}
								</Paragraph>
							</YStack>
							<Badge
								status={statusColors[item.status as keyof typeof statusColors] ?? "neutral"}
							>
								{item.status}
							</Badge>
						</XStack>
					</Card>
				)}
			/>
		</YStack>
	);
}
