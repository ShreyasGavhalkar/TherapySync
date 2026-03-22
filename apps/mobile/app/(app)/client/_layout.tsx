import { Stack } from "expo-router";

export default function ClientLayout() {
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: "#6C63FF" },
				headerTintColor: "#fff",
			}}
		>
			<Stack.Screen name="invite" options={{ title: "Invite Client", presentation: "modal" }} />
		</Stack>
	);
}
