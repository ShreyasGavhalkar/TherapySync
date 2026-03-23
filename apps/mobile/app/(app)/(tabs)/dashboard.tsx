import { useQuery } from "@tanstack/react-query";
import { H3, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Card } from "@therapysync/ui";
import { useApiClient } from "@/lib/api";
import { useThemeColors } from "@/lib/useThemeColors";

export default function DashboardScreen() {
	const { bg } = useThemeColors();
	const api = useApiClient();

	const { data: stats, isLoading } = useQuery({
		queryKey: ["admin-stats"],
		queryFn: () =>
			api.get<{ totalUsers: number; totalSessions: number; totalPayments: number }>(
				"/admin/stats",
			),
	});

	if (isLoading) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center">
				<Spinner size="large" color="$primary" />
			</YStack>
		);
	}

	return (
		<YStack flex={1} padding="$4" gap="$4" style={{ backgroundColor: bg }}>
			<H3>Admin Dashboard</H3>

			<XStack gap="$3" flexWrap="wrap">
				<Card flex={1} minWidth={140}>
					<Paragraph color="$gray10">Total Users</Paragraph>
					<H3>{stats?.totalUsers ?? 0}</H3>
				</Card>
				<Card flex={1} minWidth={140}>
					<Paragraph color="$gray10">Total Sessions</Paragraph>
					<H3>{stats?.totalSessions ?? 0}</H3>
				</Card>
			</XStack>

			<XStack gap="$3" flexWrap="wrap">
				<Card flex={1} minWidth={140}>
					<Paragraph color="$gray10">Total Payments</Paragraph>
					<H3>{stats?.totalPayments ?? 0}</H3>
				</Card>
			</XStack>
		</YStack>
	);
}
