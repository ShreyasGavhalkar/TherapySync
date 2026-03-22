import { Alert, FlatList, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { H4, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Card, Badge, Button } from "@therapysync/ui";
import { useClients, useAcceptRelationship, useRejectRelationship, type ClientRelationship } from "@/hooks/useClients";
import { useAuthStore } from "@/lib/auth-store";
import { useState, useMemo } from "react";

const statusColors = {
	active: "success",
	archived: "neutral",
	pending_invite: "warning",
	pending_approval: "info",
	rejected: "error",
} as const;

type Tab = "requests" | "active";

export default function ClientsScreen() {
	const router = useRouter();
	const role = useAuthStore((s) => s.dbUser?.role);
	const userId = useAuthStore((s) => s.dbUser?.id);
	const [refreshing, setRefreshing] = useState(false);
	const [tab, setTab] = useState<Tab>("requests");
	const isTherapist = role === "therapist" || role === "admin";

	const { data: relationships, isLoading, refetch } = useClients();
	const acceptMutation = useAcceptRelationship();
	const rejectMutation = useRejectRelationship();

	const { requests, active } = useMemo(() => {
		const all = relationships ?? [];
		return {
			requests: all.filter((r) =>
				r.status === "pending_invite" || r.status === "pending_approval",
			),
			active: all.filter((r) => r.status === "active"),
		};
	}, [relationships]);

	const currentList = tab === "requests" ? requests : active;

	const onRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	const handleAccept = (id: string) => {
		acceptMutation.mutate(id, {
			onError: (err) => Alert.alert("Error", err.message),
		});
	};

	const handleReject = (id: string) => {
		Alert.alert("Reject", "Are you sure you want to reject this?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Reject",
				style: "destructive",
				onPress: () => rejectMutation.mutate(id, {
					onError: (err) => Alert.alert("Error", err.message),
				}),
			},
		]);
	};

	if (isLoading) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center">
				<Spinner size="large" color="$primary" />
			</YStack>
		);
	}

	const renderItem = ({ item }: { item: ClientRelationship }) => {
		const person = isTherapist ? item.client : item.therapist;
		if (!person) return null;

		const needsMyAction =
			(item.status === "pending_invite" && item.initiatedBy !== userId) ||
			(item.status === "pending_approval" && item.initiatedBy !== userId);
		const iSent = item.initiatedBy === userId;

		return (
			<Card>
				<XStack justifyContent="space-between" alignItems="flex-start">
					<YStack flex={1}>
						<H4>{person.firstName} {person.lastName}</H4>
						<Paragraph color="$gray10" fontSize="$3">{person.email}</Paragraph>
					</YStack>
					{tab === "requests" && (
						<Badge status={statusColors[item.status as keyof typeof statusColors] ?? "neutral"}>
							{iSent ? "Sent" : "Received"}
						</Badge>
					)}
				</XStack>

				{needsMyAction && (
					<XStack gap="$2" marginTop="$3">
						<Button
							variant="primary"
							size="sm"
							flex={1}
							onPress={() => handleAccept(item.id)}
							disabled={acceptMutation.isPending}
						>
							Accept
						</Button>
						<Button
							variant="danger"
							size="sm"
							flex={1}
							onPress={() => handleReject(item.id)}
							disabled={rejectMutation.isPending}
						>
							Reject
						</Button>
					</XStack>
				)}

				{iSent && tab === "requests" && (
					<Paragraph color="$gray9" fontSize="$2" marginTop="$2">
						Waiting for response...
					</Paragraph>
				)}
			</Card>
		);
	};

	return (
		<YStack flex={1} backgroundColor="$background">
			{/* Tab bar */}
			<XStack borderBottomWidth={1} borderColor="$borderColor">
				<Pressable onPress={() => setTab("requests")} style={{ flex: 1 }}>
					<YStack
						paddingVertical="$3"
						alignItems="center"
						borderBottomWidth={2}
						borderColor={tab === "requests" ? "$blue8" : "transparent"}
					>
						<Paragraph
							fontWeight="600"
							color={tab === "requests" ? "$blue10" : "$gray10"}
						>
							Requests{requests.length > 0 ? ` (${requests.length})` : ""}
						</Paragraph>
					</YStack>
				</Pressable>
				<Pressable onPress={() => setTab("active")} style={{ flex: 1 }}>
					<YStack
						paddingVertical="$3"
						alignItems="center"
						borderBottomWidth={2}
						borderColor={tab === "active" ? "$blue8" : "transparent"}
					>
						<Paragraph
							fontWeight="600"
							color={tab === "active" ? "$blue10" : "$gray10"}
						>
							Active{active.length > 0 ? ` (${active.length})` : ""}
						</Paragraph>
					</YStack>
				</Pressable>
			</XStack>

			<FlatList
				data={currentList}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 16, gap: 12 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				ListHeaderComponent={
					isTherapist && tab === "active" ? (
						<YStack marginBottom="$2">
							<Button variant="primary" onPress={() => router.push("/(app)/client/invite")}>
								Invite Client
							</Button>
						</YStack>
					) : null
				}
				ListEmptyComponent={
					<YStack padding="$6" alignItems="center">
						<Paragraph color="$gray10">
							{tab === "requests"
								? "No pending requests"
								: isTherapist
									? "No active clients yet"
									: "No active connections yet"}
						</Paragraph>
					</YStack>
				}
				renderItem={renderItem}
			/>
		</YStack>
	);
}
