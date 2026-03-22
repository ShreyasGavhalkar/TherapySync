import { Stack } from "expo-router";

export default function TherapistLayout() {
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: "#6C63FF" },
				headerTintColor: "#fff",
			}}
		>
			<Stack.Screen name="[id]" options={{ title: "Therapist Profile" }} />
		</Stack>
	);
}
