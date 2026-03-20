import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { H2, Paragraph, YStack } from "tamagui";
import { Button, Input } from "@therapysync/ui";

export default function SignIn() {
	const { signIn, setActive, isLoaded } = useSignIn();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSignIn = async () => {
		if (!isLoaded) return;
		setLoading(true);
		setError("");

		try {
			const result = await signIn.create({
				identifier: email,
				password,
			});

			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.replace("/(app)/(tabs)/schedule");
			}
		} catch (err: any) {
			setError(err.errors?.[0]?.message ?? "Sign in failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<YStack flex={1} justifyContent="center" padding="$6" gap="$4" backgroundColor="$background">
			<YStack gap="$2" alignItems="center">
				<H2 color="$primary">TherapySync</H2>
				<Paragraph color="$gray10">Sign in to your account</Paragraph>
			</YStack>

			<YStack gap="$3">
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

			<Button variant="primary" onPress={handleSignIn} disabled={loading}>
				{loading ? "Signing in..." : "Sign In"}
			</Button>

			<Button variant="ghost" onPress={() => router.push("/(auth)/sign-up")}>
				Don't have an account? Sign Up
			</Button>
		</YStack>
	);
}
