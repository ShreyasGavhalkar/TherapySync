import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl } from "react-native";
import { H4, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Card, Badge } from "@therapysync/ui";
import { useApiClient } from "@/lib/api";
import type { Payment } from "@therapysync/shared";
import { useState } from "react";

const statusColors = {
	pending: "warning",
	paid: "success",
	overdue: "error",
	waived: "neutral",
	refunded: "info",
} as const;

function formatCurrency(cents: number, currency = "USD") {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(cents / 100);
}

export default function PaymentsScreen() {
	const api = useApiClient();
	const [refreshing, setRefreshing] = useState(false);

	const {
		data: paymentsList,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["payments"],
		queryFn: () => api.get<Payment[]>("/payments"),
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
				data={paymentsList ?? []}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 16, gap: 12 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				ListEmptyComponent={
					<YStack padding="$6" alignItems="center">
						<Paragraph color="$gray10">No payments</Paragraph>
					</YStack>
				}
				renderItem={({ item }) => (
					<Card>
						<XStack justifyContent="space-between" alignItems="center">
							<H4>{formatCurrency(item.amountCents, item.currency)}</H4>
							<Badge status={statusColors[item.status]}>{item.status}</Badge>
						</XStack>
						<Paragraph color="$gray10" marginTop="$2">
							Due: {new Date(item.dueDate).toLocaleDateString()}
						</Paragraph>
						{item.paymentMethod && (
							<Paragraph color="$gray9" fontSize="$3" marginTop="$1">
								Method: {item.paymentMethod}
							</Paragraph>
						)}
					</Card>
				)}
			/>
		</YStack>
	);
}
