import { Stack } from "expo-router";

export default function PaymentLayout() {
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: "#6C63FF" },
				headerTintColor: "#fff",
			}}
		>
			<Stack.Screen name="create" options={{ title: "Record Payment", presentation: "modal" }} />
		</Stack>
	);
}
