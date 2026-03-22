import { Stack } from "expo-router";

export default function ClientDetailLayout() {
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: "#6C63FF" },
				headerTintColor: "#fff",
			}}
		>
			<Stack.Screen name="[id]" options={{ title: "Client Details" }} />
		</Stack>
	);
}
