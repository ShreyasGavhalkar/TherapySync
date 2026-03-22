import { Alert, Pressable, RefreshControl, SectionList } from "react-native";
import { useRouter } from "expo-router";
import { Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Card, Badge, Button } from "@therapysync/ui";
import { useClients, useAcceptRelationship, useRejectRelationship, type ClientRelationship } from "@/hooks/useClients";
import { useAuthStore } from "@/lib/auth-store";
import { useState, useMemo } from "react";
import { ChevronRight } from "@tamagui/lucide-icons";

export default function ClientsScreen() {
	const router = useRouter();
	const role = useAuthStore((s) => s.dbUser?.role);
	const userId = useAuthStore((s) => s.dbUser?.id);
	const [refreshing, setRefreshing] = useState(false);
	const isTherapist = role === "therapist" || role === "admin";

	const { data: relationships, isLoading, refetch } = useClients();
	const acceptMutation = useAcceptRelationship();
	const rejectMutation = useRejectRelationship();

	const sections = useMemo(() => {
		const all = relationships ?? [];
		const requests = all.filter((r) => r.status === "pending_invite" || r.status === "pending_approval");
		const active = all.filter((r) => r.status === "active");
		const result = [];
		if (requests.length > 0) result.push({ title: `Requests (${requests.length})`, data: requests });
		result.push({ title: `Active Connections (${active.length})`, data: active });
		return result;
	}, [relationships]);

	const onRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	const handleAccept = (id: string) => {
		acceptMutation.mutate(id, { onError: (err) => Alert.alert("Error", err.message) });
	};

	const handleReject = (id: string) => {
		Alert.alert("Reject", "Are you sure?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Reject", style: "destructive", onPress: () => rejectMutation.mutate(id, { onError: (err) => Alert.alert("Error", err.message) }) },
		]);
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
			<SectionList
				sections={sections}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 16 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				stickySectionHeadersEnabled={false}
				ListHeaderComponent={
					isTherapist ? (
						<YStack marginBottom="$3">
							<Button variant="primary" onPress={() => router.push("/(app)/client/invite")}>
								Invite Client
							</Button>
						</YStack>
					) : null
				}
				renderSectionHeader={({ section }) => (
					<YStack paddingTop="$4" paddingBottom="$2">
						<Paragraph fontWeight="700" fontSize="$4" color="$gray11">
							{section.title}
						</Paragraph>
					</YStack>
				)}
				renderItem={({ item, section }) => {
					const person = isTherapist ? item.client : item.therapist;
					if (!person) return null;

					const isRequestSection = section.title.startsWith("Requests");
					const needsMyAction =
						(item.status === "pending_invite" && item.initiatedBy !== userId) ||
						(item.status === "pending_approval" && item.initiatedBy !== userId);
					const iSent = item.initiatedBy === userId;

					// Request card
					if (isRequestSection) {
						return (
							<YStack marginBottom="$2">
								<Card>
									<XStack justifyContent="space-between" alignItems="flex-start">
										<YStack flex={1}>
											<Paragraph fontWeight="600">{person.firstName} {person.lastName}</Paragraph>
											<Paragraph color="$gray10" fontSize="$2">{person.email}</Paragraph>
										</YStack>
										<Badge status={iSent ? "warning" : "info"}>
											{iSent ? "Sent" : "Received"}
										</Badge>
									</XStack>
									{needsMyAction && (
										<XStack gap="$2" marginTop="$3">
											<Button variant="primary" size="sm" flex={1} onPress={() => handleAccept(item.id)} disabled={acceptMutation.isPending}>Accept</Button>
											<Button variant="danger" size="sm" flex={1} onPress={() => handleReject(item.id)} disabled={rejectMutation.isPending}>Reject</Button>
										</XStack>
									)}
									{iSent && <Paragraph color="$gray9" fontSize="$2" marginTop="$2">Waiting for response...</Paragraph>}
								</Card>
							</YStack>
						);
					}

					// Active connection — tappable, opens detail
					return (
						<Pressable onPress={() => router.push(`/(app)/client-detail/${person.id}`)}>
							<YStack marginBottom="$2">
								<Card>
									<XStack justifyContent="space-between" alignItems="center">
										<XStack alignItems="center" gap="$3" flex={1}>
											<YStack
												width={40}
												height={40}
												borderRadius={20}
												backgroundColor="$blue5"
												alignItems="center"
												justifyContent="center"
											>
												<Paragraph fontSize="$3" fontWeight="700" color="$blue10">
													{person.firstName[0]}{person.lastName[0]}
												</Paragraph>
											</YStack>
											<YStack flex={1}>
												<Paragraph fontWeight="600">{person.firstName} {person.lastName}</Paragraph>
												<Paragraph color="$gray10" fontSize="$2">{person.email}</Paragraph>
											</YStack>
										</XStack>
										<ChevronRight size={18} color="$gray9" />
									</XStack>
								</Card>
							</YStack>
						</Pressable>
					);
				}}
				renderSectionFooter={({ section }) => {
					if (section.data.length === 0 && section.title.startsWith("Active")) {
						return (
							<Paragraph color="$gray10" padding="$3" textAlign="center">
								{isTherapist ? "No active clients yet" : "No active connections yet"}
							</Paragraph>
						);
					}
					return null;
				}}
			/>
		</YStack>
	);
}
