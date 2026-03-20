import { Tabs } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";
import {
	Calendar,
	Users,
	BookOpen,
	CreditCard,
	User,
	LayoutDashboard,
} from "@tamagui/lucide-icons";

export default function TabLayout() {
	const role = useAuthStore((s) => s.dbUser?.role);

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: "#6C63FF",
				headerStyle: { backgroundColor: "#6C63FF" },
				headerTintColor: "#fff",
			}}
		>
			{/* Admin-only: Dashboard */}
			<Tabs.Screen
				name="dashboard"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
					href: role === "admin" ? "/(app)/(tabs)/dashboard" : null,
				}}
			/>

			{/* Schedule — visible to all roles */}
			<Tabs.Screen
				name="schedule"
				options={{
					title: "Schedule",
					tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
				}}
			/>

			{/* Clients — therapist & admin only */}
			<Tabs.Screen
				name="clients"
				options={{
					title: "Clients",
					tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
					href: role === "client" ? null : "/(app)/(tabs)/clients",
				}}
			/>

			{/* Homework — visible to all */}
			<Tabs.Screen
				name="homework"
				options={{
					title: "Homework",
					tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
				}}
			/>

			{/* Payments — visible to all */}
			<Tabs.Screen
				name="payments"
				options={{
					title: "Payments",
					tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
				}}
			/>

			{/* Profile — visible to all */}
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
				}}
			/>
		</Tabs>
	);
}
