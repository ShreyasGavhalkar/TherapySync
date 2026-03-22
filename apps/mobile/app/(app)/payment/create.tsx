import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { addDays, format } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import { H3, Paragraph, XStack, YStack } from "tamagui";
import { Button, Input } from "@therapysync/ui";
import { useCreatePayment } from "@/hooks/usePayments";
import { useClients } from "@/hooks/useClients";
import { useAuthStore } from "@/lib/auth-store";

export default function CreatePaymentScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.dbUser?.id);
	const { data: clients } = useClients();
	const createPayment = useCreatePayment();

	const [selectedClientId, setSelectedClientId] = useState("");
	const [amount, setAmount] = useState("");
	const [dueDate, setDueDate] = useState(addDays(new Date(), 7));
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [paymentMethod, setPaymentMethod] = useState("");
	const [notes, setNotes] = useState("");
	const [status, setStatus] = useState<"pending" | "paid">("pending");

	const handleCreate = () => {
		const amountNum = Number.parseFloat(amount);
		if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
			Alert.alert("Error", "Please enter a valid amount");
			return;
		}
		if (!selectedClientId) {
			Alert.alert("Error", "Please select a client");
			return;
		}

		createPayment.mutate(
			{
				therapistId: userId ?? "",
				clientId: selectedClientId,
				sessionId: null,
				amountCents: Math.round(amountNum * 100),
				currency: "USD",
				status,
				dueDate,
				paymentMethod: paymentMethod.trim() || null,
				notes: notes.trim() || null,
			},
			{
				onSuccess: () => router.back(),
				onError: (err) => Alert.alert("Error", err.message),
			},
		);
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
			<YStack padding="$4" gap="$4">
				<H3>Record Payment</H3>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Client</Paragraph>
					{(clients ?? []).map((rel) => (
						<Pressable key={rel.client.id} onPress={() => setSelectedClientId(rel.client.id)}>
							<YStack
								padding="$3"
								borderRadius="$3"
								borderWidth={2}
								borderColor={selectedClientId === rel.client.id ? "$primary" : "$borderColor"}
								backgroundColor={selectedClientId === rel.client.id ? "$blue2" : "$background"}
							>
								<Paragraph>
									{rel.client.firstName} {rel.client.lastName}
								</Paragraph>
							</YStack>
						</Pressable>
					))}
					{(clients ?? []).length === 0 && (
						<Paragraph color="$gray10" fontSize="$3">
							No clients found. Add clients first.
						</Paragraph>
					)}
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Amount ($)</Paragraph>
					<Input
						placeholder="0.00"
						value={amount}
						onChangeText={setAmount}
						keyboardType="decimal-pad"
					/>
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Status</Paragraph>
					<XStack gap="$2">
						<Pressable onPress={() => setStatus("pending")} style={{ flex: 1 }}>
							<YStack
								padding="$3"
								borderRadius="$3"
								borderWidth={2}
								borderColor={status === "pending" ? "$primary" : "$borderColor"}
								backgroundColor={status === "pending" ? "$blue2" : "$background"}
								alignItems="center"
							>
								<Paragraph>Pending</Paragraph>
							</YStack>
						</Pressable>
						<Pressable onPress={() => setStatus("paid")} style={{ flex: 1 }}>
							<YStack
								padding="$3"
								borderRadius="$3"
								borderWidth={2}
								borderColor={status === "paid" ? "$green8" : "$borderColor"}
								backgroundColor={status === "paid" ? "$green2" : "$background"}
								alignItems="center"
							>
								<Paragraph>Paid</Paragraph>
							</YStack>
						</Pressable>
					</XStack>
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Due Date</Paragraph>
					<Pressable onPress={() => setShowDatePicker(true)}>
						<Input
							value={format(dueDate, "MMMM d, yyyy")}
							editable={false}
							pointerEvents="none"
						/>
					</Pressable>
					{showDatePicker && (
						<DateTimePicker
							value={dueDate}
							mode="date"
							display={Platform.OS === "ios" ? "spinner" : "default"}
							onChange={(_, date) => {
								setShowDatePicker(Platform.OS === "ios");
								if (date) setDueDate(date);
							}}
						/>
					)}
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Payment Method (optional)</Paragraph>
					<Input
						placeholder="e.g., Cash, Bank Transfer, UPI"
						value={paymentMethod}
						onChangeText={setPaymentMethod}
					/>
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Notes (optional)</Paragraph>
					<Input
						placeholder="Any additional notes..."
						value={notes}
						onChangeText={setNotes}
						multiline
						numberOfLines={3}
						height={80}
						textAlignVertical="top"
					/>
				</YStack>

				<Button
					variant="primary"
					onPress={handleCreate}
					disabled={createPayment.isPending}
					size="lg"
				>
					{createPayment.isPending ? "Recording..." : "Record Payment"}
				</Button>
			</YStack>
		</ScrollView>
	);
}
