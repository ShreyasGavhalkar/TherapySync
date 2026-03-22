import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { H3, Paragraph, YStack } from "tamagui";
import { Button, Input } from "@therapysync/ui";
import { useInviteClient } from "@/hooks/useClients";

export default function InviteClientScreen() {
	const router = useRouter();
	const inviteClient = useInviteClient();

	const [email, setEmail] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");

	const handleInvite = () => {
		if (!email.trim()) {
			Alert.alert("Error", "Please enter an email address");
			return;
		}
		if (!firstName.trim()) {
			Alert.alert("Error", "Please enter a first name");
			return;
		}
		if (!lastName.trim()) {
			Alert.alert("Error", "Please enter a last name");
			return;
		}

		inviteClient.mutate(
			{
				email: email.trim().toLowerCase(),
				firstName: firstName.trim(),
				lastName: lastName.trim(),
			},
			{
				onSuccess: () => {
					Alert.alert("Success", "Client invited successfully");
					router.back();
				},
				onError: (err) => Alert.alert("Error", err.message),
			},
		);
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
			<YStack padding="$4" gap="$4">
				<H3>Invite Client</H3>
				<Paragraph color="$gray10">
					Enter your client's details to add them to your practice.
				</Paragraph>

				<YStack gap="$2">
					<Paragraph fontWeight="600">First Name</Paragraph>
					<Input placeholder="First name" value={firstName} onChangeText={setFirstName} />
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Last Name</Paragraph>
					<Input placeholder="Last name" value={lastName} onChangeText={setLastName} />
				</YStack>

				<YStack gap="$2">
					<Paragraph fontWeight="600">Email</Paragraph>
					<Input
						placeholder="client@email.com"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
					/>
				</YStack>

				<Button
					variant="primary"
					onPress={handleInvite}
					disabled={inviteClient.isPending}
					size="lg"
				>
					{inviteClient.isPending ? "Inviting..." : "Invite Client"}
				</Button>
			</YStack>
		</ScrollView>
	);
}
