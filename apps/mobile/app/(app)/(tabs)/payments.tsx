import { FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { H4, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Card, Badge, Button } from "@therapysync/ui";
import { usePayments, usePaymentSummary } from "@/hooks/usePayments";
import { useAuthStore } from "@/lib/auth-store";
import { useState } from "react";
import { useThemeColors } from "@/lib/useThemeColors";

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
	const { bg } = useThemeColors();
	const router = useRouter();
	const role = useAuthStore((s) => s.dbUser?.role);
	const [refreshing, setRefreshing] = useState(false);
	const isTherapist = role === "therapist" || role === "admin";

	const { data: paymentsList, isLoading, refetch } = usePayments();
	const { data: summary } = usePaymentSummary();

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

	const paidTotal = summary?.find((s) => s.status === "paid")?.totalCents ?? 0;
	const pendingTotal = summary?.find((s) => s.status === "pending")?.totalCents ?? 0;
	const overdueTotal = summary?.find((s) => s.status === "overdue")?.totalCents ?? 0;
	const totalCount = summary?.reduce((acc, s) => acc + s.count, 0) ?? 0;

	return (
		<YStack flex={1} style={{ backgroundColor: bg }}>
			<FlatList
				data={paymentsList ?? []}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				ListHeaderComponent={
					<YStack gap="$3" marginBottom="$2">
						{summary && summary.length > 0 && (
							<Card>
								<H4 marginBottom="$2">Summary</H4>
								{isTherapist ? (
									<XStack justifyContent="space-between">
										<YStack alignItems="center" flex={1}>
											<Paragraph color="$green10" fontWeight="700" fontSize="$5">
												{formatCurrency(paidTotal)}
											</Paragraph>
											<Paragraph color="$gray10" fontSize="$2">Received</Paragraph>
										</YStack>
										<YStack alignItems="center" flex={1}>
											<Paragraph color="$orange10" fontWeight="700" fontSize="$5">
												{formatCurrency(pendingTotal)}
											</Paragraph>
											<Paragraph color="$gray10" fontSize="$2">Pending</Paragraph>
										</YStack>
										<YStack alignItems="center" flex={1}>
											<Paragraph color="$red10" fontWeight="700" fontSize="$5">
												{formatCurrency(overdueTotal)}
											</Paragraph>
											<Paragraph color="$gray10" fontSize="$2">Overdue</Paragraph>
										</YStack>
									</XStack>
								) : (
									<XStack justifyContent="space-between">
										<YStack alignItems="center" flex={1}>
											<Paragraph color="$orange10" fontWeight="700" fontSize="$5">
												{formatCurrency(pendingTotal)}
											</Paragraph>
											<Paragraph color="$gray10" fontSize="$2">Pending</Paragraph>
										</YStack>
										<YStack alignItems="center" flex={1}>
											<Paragraph fontWeight="700" fontSize="$5">
												{totalCount}
											</Paragraph>
											<Paragraph color="$gray10" fontSize="$2">Total</Paragraph>
										</YStack>
									</XStack>
								)}
							</Card>
						)}
						{isTherapist && (
							<Button variant="primary" onPress={() => router.push("/(app)/payment/create")}>
								Record Payment
							</Button>
						)}
					</YStack>
				}
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
