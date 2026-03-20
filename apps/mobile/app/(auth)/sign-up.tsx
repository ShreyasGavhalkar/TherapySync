import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { H2, Paragraph, YStack } from "tamagui";
import { Button, Input } from "@therapysync/ui";

export default function SignUp() {
	const { signUp, setActive, isLoaded } = useSignUp();
	const router = useRouter();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSignUp = async () => {
		if (!isLoaded) return;
		setLoading(true);
		setError("");

		try {
			const result = await signUp.create({
				firstName,
				lastName,
				emailAddress: email,
				password,
			});

			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.replace("/(app)/(tabs)/schedule");
			}
			// Handle email verification if required by Clerk settings
		} catch (err: any) {
			setError(err.errors?.[0]?.message ?? "Sign up failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<YStack flex={1} justifyContent="center" padding="$6" gap="$4" backgroundColor="$background">
			<YStack gap="$2" alignItems="center">
				<H2 color="$primary">TherapySync</H2>
				<Paragraph color="$gray10">Create your account</Paragraph>
			</YStack>

			<YStack gap="$3">
				<Input placeholder="First Name" value={firstName} onChangeText={setFirstName} />
				<Input placeholder="Last Name" value={lastName} onChangeText={setLastName} />
				<Input
					placeholder="Email"
					value={email}
					onChangeText={setEmail}
					autoCapitalize="none"
					keyboardType="email-address"
				/>
				<Input
					placeholder="Password"
					value={password}
					onChangeText={setPassword}
					secureTextEntry
				/>
			</YStack>

			{error ? <Paragraph color="$red10">{error}</Paragraph> : null}

			<Button variant="primary" onPress={handleSignUp} disabled={loading}>
				{loading ? "Creating account..." : "Sign Up"}
			</Button>

			<Button variant="ghost" onPress={() => router.back()}>
				Already have an account? Sign In
			</Button>
		</YStack>
	);
}
