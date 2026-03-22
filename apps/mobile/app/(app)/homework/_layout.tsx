import { Stack } from "expo-router";

export default function HomeworkLayout() {
	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: "#6C63FF" },
				headerTintColor: "#fff",
			}}
		>
			<Stack.Screen name="[id]" options={{ title: "Homework Details" }} />
			<Stack.Screen name="create" options={{ title: "Assign Homework", presentation: "modal" }} />
		</Stack>
	);
}
