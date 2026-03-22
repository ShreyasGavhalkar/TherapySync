import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable } from "react-native";
import { H2, Paragraph, XStack, YStack } from "tamagui";
import { Button, Input } from "@therapysync/ui";

type Role = "client" | "therapist";
type Step = "role" | "credentials" | "therapist-details" | "verification";

export default function SignUp() {
	const { signUp, setActive, isLoaded } = useSignUp();
	const router = useRouter();

	const [step, setStep] = useState<Step>("role");
	const [role, setRole] = useState<Role>("client");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [certification, setCertification] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");

	const handleCreateAccount = async () => {
		if (!isLoaded) return;
		setLoading(true);
		setError("");

		try {
			const metadata: Record<string, string> = { role };
			if (role === "therapist") {
				metadata.phone = phone;
				metadata.address = address;
				metadata.certification = certification;
			}

			const result = await signUp.create({
				firstName,
				lastName,
				emailAddress: email,
				password,
				unsafeMetadata: metadata,
			});

			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.replace("/(app)/(tabs)/schedule");
			} else if (result.status === "missing_requirements") {
				await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
				setStep("verification");
			}
		} catch (err: any) {
			setError(err.errors?.[0]?.message ?? "Sign up failed");
		} finally {
			setLoading(false);
		}
	};

	const handleVerify = async () => {
		if (!isLoaded) return;
		setLoading(true);
		setError("");

		try {
			const result = await signUp.attemptEmailAddressVerification({
				code: verificationCode,
			});
			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.replace("/(app)/(tabs)/schedule");
			}
		} catch (err: any) {
			setError(err.errors?.[0]?.message ?? "Verification failed");
		} finally {
			setLoading(false);
		}
	};

	const handleNext = () => {
		setError("");
		if (step === "role") {
			setStep("credentials");
		} else if (step === "credentials") {
			if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
				setError("Please fill in all fields");
				return;
			}
			if (role === "therapist") {
				setStep("therapist-details");
			} else {
				handleCreateAccount();
			}
		} else if (step === "therapist-details") {
			if (!phone.trim()) {
				setError("Phone number is required");
				return;
			}
			if (!certification.trim()) {
				setError("Certification details are required");
				return;
			}
			handleCreateAccount();
		}
	};

	// Step: Verification
	if (step === "verification") {
		return (
			<YStack flex={1} justifyContent="center" padding="$6" gap="$4" backgroundColor="$background">
				<YStack gap="$2" alignItems="center">
					<H2 color="$primary">Verify Email</H2>
					<Paragraph color="$gray10">We sent a code to {email}</Paragraph>
				</YStack>
				<Input
					placeholder="Verification code"
					value={verificationCode}
					onChangeText={setVerificationCode}
					keyboardType="number-pad"
				/>
				{error ? <Paragraph color="$red10">{error}</Paragraph> : null}
				<Button variant="primary" onPress={handleVerify} disabled={loading}>
					{loading ? "Verifying..." : "Verify Email"}
				</Button>
			</YStack>
		);
	}

	// Step: Role selection
	if (step === "role") {
		return (
			<YStack flex={1} justifyContent="center" padding="$6" gap="$6" backgroundColor="$background">
				<YStack gap="$2" alignItems="center">
					<H2 color="$primary">TherapySync</H2>
					<Paragraph color="$gray10">How will you use TherapySync?</Paragraph>
				</YStack>

				<YStack gap="$3">
					<Pressable onPress={() => setRole("client")}>
						<YStack
							padding="$4"
							borderRadius="$4"
							borderWidth={2}
							borderColor={role === "client" ? "$blue8" : "$borderColor"}
							backgroundColor={role === "client" ? "$blue2" : "$background"}
							gap="$1"
						>
							<Paragraph fontWeight="700" fontSize="$5" color={role === "client" ? "$blue10" : "$color"}>
								I'm a Client
							</Paragraph>
							<Paragraph color="$gray10" fontSize="$3">
								I'm looking for a therapist or already seeing one
							</Paragraph>
						</YStack>
					</Pressable>

					<Pressable onPress={() => setRole("therapist")}>
						<YStack
							padding="$4"
							borderRadius="$4"
							borderWidth={2}
							borderColor={role === "therapist" ? "$blue8" : "$borderColor"}
							backgroundColor={role === "therapist" ? "$blue2" : "$background"}
							gap="$1"
						>
							<Paragraph fontWeight="700" fontSize="$5" color={role === "therapist" ? "$blue10" : "$color"}>
								I'm a Therapist
							</Paragraph>
							<Paragraph color="$gray10" fontSize="$3">
								I provide therapy and want to manage my practice
							</Paragraph>
						</YStack>
					</Pressable>
				</YStack>

				<Button variant="primary" onPress={handleNext}>
					Continue
				</Button>

				<Button variant="ghost" onPress={() => router.back()}>
					Already have an account? Sign In
				</Button>
			</YStack>
		);
	}

	// Step: Credentials
	if (step === "credentials") {
		return (
			<YStack flex={1} justifyContent="center" padding="$6" gap="$4" backgroundColor="$background">
				<YStack gap="$2" alignItems="center">
					<H2 color="$primary">Create Account</H2>
					<Paragraph color="$gray10">
						Signing up as {role === "therapist" ? "a Therapist" : "a Client"}
					</Paragraph>
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

				<Button variant="primary" onPress={handleNext} disabled={loading}>
					{loading && role === "client" ? "Creating account..." : "Continue"}
				</Button>

				<Button variant="ghost" onPress={() => setStep("role")}>
					Back
				</Button>
			</YStack>
		);
	}

	// Step: Therapist details
	return (
		<YStack flex={1} justifyContent="center" padding="$6" gap="$4" backgroundColor="$background">
			<YStack gap="$2" alignItems="center">
				<H2 color="$primary">Professional Details</H2>
				<Paragraph color="$gray10">
					We need a few more details to set up your practice
				</Paragraph>
			</YStack>

			<YStack gap="$3">
				<YStack gap="$1">
					<Paragraph fontSize="$3" fontWeight="600">Phone Number *</Paragraph>
					<Input
						placeholder="+1 (555) 123-4567"
						value={phone}
						onChangeText={setPhone}
						keyboardType="phone-pad"
					/>
					<Paragraph fontSize="$2" color="$gray9">
						Clients will see this to contact you
					</Paragraph>
				</YStack>

				<YStack gap="$1">
					<Paragraph fontSize="$3" fontWeight="600">Practice Address</Paragraph>
					<Input
						placeholder="City, State"
						value={address}
						onChangeText={setAddress}
					/>
					<Paragraph fontSize="$2" color="$gray9">
						Helps clients find you by location
					</Paragraph>
				</YStack>

				<YStack gap="$1">
					<Paragraph fontSize="$3" fontWeight="600">Certification / License *</Paragraph>
					<Input
						placeholder="e.g., Licensed Clinical Psychologist, LCSW"
						value={certification}
						onChangeText={setCertification}
					/>
				</YStack>
			</YStack>

			{error ? <Paragraph color="$red10">{error}</Paragraph> : null}

			<Button variant="primary" onPress={handleNext} disabled={loading}>
				{loading ? "Creating account..." : "Complete Sign Up"}
			</Button>

			<Button variant="ghost" onPress={() => setStep("credentials")}>
				Back
			</Button>
		</YStack>
	);
}
