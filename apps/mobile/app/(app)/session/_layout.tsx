import { Stack } from "expo-router";

export default function SessionLayout() {
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: "#6C63FF" },
				headerTintColor: "#fff",
			}}
		>
			<Stack.Screen name="[id]" options={{ title: "Session Details" }} />
			<Stack.Screen name="create" options={{ title: "New Session", presentation: "modal" }} />
			<Stack.Screen name="edit" options={{ title: "Edit Session", presentation: "modal" }} />
		</Stack>
	);
}
