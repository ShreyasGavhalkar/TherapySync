import { useState } from "react";
import { FlatList, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { H4, Paragraph, XStack, YStack, Spinner } from "tamagui";
import { Card, Input } from "@therapysync/ui";
import { useDiscoverTherapists } from "@/hooks/useDiscover";
import { useClients } from "@/hooks/useClients";
import { Star } from "@tamagui/lucide-icons";
import { useMemo } from "react";

export default function DiscoverScreen() {
	const router = useRouter();
	const [city, setCity] = useState("");
	const [refreshing, setRefreshing] = useState(false);

	const { data: therapists, isLoading, refetch } = useDiscoverTherapists(
		city.trim() ? { city: city.trim() } : undefined,
	);
	const { data: relationships } = useClients();

	const connectedIds = useMemo(() => {
		return new Set((relationships ?? []).filter((r) => r.status === "active").map((r) => r.therapist?.id).filter(Boolean));
	}, [relationships]);

	const filteredTherapists = useMemo(() => {
		return (therapists ?? []).filter((t) => !connectedIds.has(t.id));
	}, [therapists, connectedIds]);

	const onRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	return (
		<YStack flex={1} backgroundColor="$background">
			<YStack padding="$4" paddingBottom="$2">
				<Input
					placeholder="Search by city..."
					value={city}
					onChangeText={setCity}
				/>
			</YStack>

			{isLoading ? (
				<YStack flex={1} justifyContent="center" alignItems="center">
					<Spinner size="large" color="$primary" />
				</YStack>
			) : (
				<FlatList
					data={filteredTherapists}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ padding: 16, gap: 12 }}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
					ListEmptyComponent={
						<YStack padding="$6" alignItems="center">
							<Paragraph color="$gray10">No therapists found</Paragraph>
						</YStack>
					}
					renderItem={({ item }) => (
						<Pressable onPress={() => router.push(`/(app)/therapist/${item.id}`)}>
							<Card>
								<XStack justifyContent="space-between" alignItems="flex-start">
									<YStack flex={1}>
										<H4>{item.firstName} {item.lastName}</H4>
										{item.city && (
											<Paragraph color="$gray10" fontSize="$3">{item.city}</Paragraph>
										)}
										{item.specializations && (
											<Paragraph color="$gray9" fontSize="$2" marginTop="$1">
												{item.specializations}
											</Paragraph>
										)}
										{item.bio && (
											<Paragraph color="$gray10" fontSize="$3" marginTop="$1" numberOfLines={2}>
												{item.bio}
											</Paragraph>
										)}
									</YStack>
									<YStack alignItems="center" marginLeft="$3">
										<XStack alignItems="center" gap="$1">
											<Star size={16} color="$yellow10" fill="$yellow10" />
											<Paragraph fontWeight="700">
												{item.averageRating ? item.averageRating.toFixed(1) : "—"}
											</Paragraph>
										</XStack>
										<Paragraph color="$gray9" fontSize="$1">
											{item.totalReviews} review{item.totalReviews !== 1 ? "s" : ""}
										</Paragraph>
									</YStack>
								</XStack>
							</Card>
						</Pressable>
					)}
				/>
			)}
		</YStack>
	);
}
