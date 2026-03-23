import { ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { H3, H4, Paragraph, Separator, XStack, YStack, Spinner } from "tamagui";
import { Badge, Card } from "@therapysync/ui";
import { useApiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { FileText, DollarSign } from "@tamagui/lucide-icons";

type SessionDetail = {
	id: string;
	title: string;
	startTime: string;
	endTime: string;
	status: string;
	location: string | null;
	hasNote: boolean;
	noteId: string | null;
	noteSigned: boolean;
	payment: { id?: string; amountCents: number; currency: string; status: string; paidAt?: string | null } | null;
};

type RecentPayment = {
	id: string;
	amountCents: number;
	currency: string;
	status: string;
	dueDate: string;
	paidAt: string | null;
	createdAt: string;
};

type ClientDetail = {
	person: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		phone: string | null;
	};
	relationship: { id: string; status: string; startedAt: string | null };
	sessions: SessionDetail[];
	recentPayments: RecentPayment[];
	totalPayments: number;
};

const sessionStatusColors: Record<string, string> = {
	pending: "warning",
	confirmed: "success",
	cancelled: "error",
	completed: "info",
	no_show: "neutral",
};

const paymentStatusColors: Record<string, string> = {
	paid: "success",
	pending: "warning",
	overdue: "error",
	unpaid: "error",
	waived: "neutral",
	refunded: "info",
};

function formatCurrency(cents: number, currency = "USD") {
	if (cents === 0) return "—";
	return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default function ClientDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const api = useApiClient();
	const role = useAuthStore((s) => s.dbUser?.role);
	const isTherapist = role === "therapist" || role === "admin";

	const { data, isLoading } = useQuery({
		queryKey: ["client-detail", id],
		queryFn: () => api.get<ClientDetail>(`/therapist/clients/detail/${id}`),
		enabled: !!id,
	});

	if (isLoading || !data) {
		return (
			<YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
				<Spinner size="large" color="$primary" />
			</YStack>
		);
	}

	const { person, relationship, sessions } = data;
	const upcomingSessions = sessions.filter((s) => s.status === "pending" || s.status === "confirmed");
	const pastSessions = sessions.filter((s) => s.status === "completed" || s.status === "cancelled" || s.status === "no_show");

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
			<YStack padding="$4" gap="$4">
				{/* Person header */}
				<Card>
					<YStack alignItems="center" gap="$2" padding="$2">
						<YStack
							width={64}
							height={64}
							borderRadius={32}
							backgroundColor="$blue5"
							alignItems="center"
							justifyContent="center"
						>
							<Paragraph fontSize="$7" fontWeight="700" color="$blue10">
								{person.firstName[0]}{person.lastName[0]}
							</Paragraph>
						</YStack>
						<H3>{person.firstName} {person.lastName}</H3>
						<Paragraph color="$gray10">{person.email}</Paragraph>
						{person.phone && <Paragraph color="$gray9" fontSize="$3">{person.phone}</Paragraph>}
						{relationship.startedAt && (
							<Paragraph color="$gray9" fontSize="$2">
								Connected since {format(new Date(relationship.startedAt), "MMM d, yyyy")}
							</Paragraph>
						)}
					</YStack>
				</Card>

				{/* Upcoming sessions */}
				{upcomingSessions.length > 0 && (
					<YStack gap="$2">
						<H4 color="$gray11">Upcoming</H4>
						{upcomingSessions.map((session) => (
							<SessionCard
								key={session.id}
								session={session}
								isTherapist={isTherapist}
								onPress={() => router.push(`/(app)/session/${session.id}`)}
							/>
						))}
					</YStack>
				)}

				{/* Past sessions */}
				<YStack gap="$2">
					<H4 color="$gray11">Past Sessions ({pastSessions.length})</H4>
					{pastSessions.length === 0 ? (
						<Paragraph color="$gray10" padding="$3">No past sessions</Paragraph>
					) : (
						pastSessions.map((session) => (
							<SessionCard
								key={session.id}
								session={session}
								isTherapist={isTherapist}
								onPress={() => router.push(`/(app)/session/${session.id}`)}
							/>
						))
					)}
				</YStack>

				{/* Recent Payments — therapist only */}
				{isTherapist && (
					<YStack gap="$2">
						<H4 color="$gray11">
							Recent Payments ({data.recentPayments.length}{data.totalPayments > 5 ? ` of ${data.totalPayments}` : ""})
						</H4>
						{data.recentPayments.length === 0 ? (
							<Paragraph color="$gray10" padding="$3">No payments yet</Paragraph>
						) : (
							data.recentPayments.map((p) => (
								<Card key={p.id}>
									<XStack justifyContent="space-between" alignItems="center">
										<Paragraph fontSize="$3" color="$gray10">
											{format(new Date(p.createdAt), "dd/MM/yyyy")}
										</Paragraph>
										<XStack alignItems="center" gap="$2">
											{p.status === "paid" && (
												<Paragraph fontWeight="700" color="$green10">
													{formatCurrency(p.amountCents, p.currency)}
												</Paragraph>
											)}
											<Badge status={
												p.status === "paid" ? "success" :
												p.status === "pending" ? "warning" : "error"
											}>
												{p.status}
											</Badge>
										</XStack>
									</XStack>
								</Card>
							))
						)}
						{data.totalPayments > 5 && (
							<Pressable onPress={() => {
								// Navigate to payments tab — can't easily pass filter in Expo Router tabs,
								// so just navigate there
								router.push("/(app)/(tabs)/payments");
							}}>
								<Paragraph color="$blue10" textAlign="center" fontWeight="600" padding="$2">
									View all {data.totalPayments} payments
								</Paragraph>
							</Pressable>
						)}
					</YStack>
				)}
			</YStack>
		</ScrollView>
	);
}

function SessionCard({
	session,
	isTherapist,
	onPress,
}: {
	session: SessionDetail;
	isTherapist: boolean;
	onPress: () => void;
}) {
	const router = useRouter();

	return (
		<Pressable onPress={onPress}>
			<Card>
				{/* Title + status */}
				<XStack justifyContent="space-between" alignItems="center">
					<Paragraph fontWeight="600" flex={1}>{session.title}</Paragraph>
					<Badge status={sessionStatusColors[session.status] as any}>
						{session.status.replace("_", " ")}
					</Badge>
				</XStack>

				{/* Date/time */}
				<Paragraph color="$gray10" fontSize="$3" marginTop="$1">
					{format(new Date(session.startTime), "dd/MM/yyyy")} {format(new Date(session.startTime), "h:mm a")} — {format(new Date(session.endTime), "h:mm a")}
				</Paragraph>

				{/* Notes + Payment row */}
				<XStack gap="$3" marginTop="$2" alignItems="center">
					{/* Notes indicator */}
					{isTherapist && (
						<XStack alignItems="center" gap="$1">
							<FileText size={14} color={session.hasNote ? "$blue10" : "$gray8"} />
							<Paragraph fontSize="$2" color={session.hasNote ? "$blue10" : "$gray9"}>
								{session.hasNote ? (session.noteSigned ? "Signed" : "Draft") : "No notes"}
							</Paragraph>
						</XStack>
					)}

					{/* Payment indicator */}
					{session.payment && (
						<XStack alignItems="center" gap="$1">
							<DollarSign size={14} color={
								session.payment.status === "paid" ? "$green10" :
								session.payment.status === "unpaid" ? "$red10" : "$orange10"
							} />
							<Paragraph fontSize="$2" color={
								session.payment.status === "paid" ? "$green10" :
								session.payment.status === "unpaid" ? "$red10" : "$orange10"
							}>
								{session.payment.status === "unpaid"
									? "Unpaid"
									: session.payment.status === "paid"
										? `Paid ${formatCurrency(session.payment.amountCents, session.payment.currency)}`
										: session.payment.status.charAt(0).toUpperCase() + session.payment.status.slice(1)}
							</Paragraph>
						</XStack>
					)}
				</XStack>
			</Card>
		</Pressable>
	);
}
