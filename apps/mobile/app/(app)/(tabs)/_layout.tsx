import { Tabs } from "expo-router";
import { useAuthStore } from "@/lib/auth-store";
import {
	Calendar,
	Users,
	BookOpen,
	CreditCard,
	User,
	LayoutDashboard,
	Search,
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

			{/* Connections — visible to all */}
			<Tabs.Screen
				name="clients"
				options={{
					title: role === "client" ? "My Therapists" : "Clients",
					tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
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

			{/* Discover — visible to clients */}
			<Tabs.Screen
				name="discover"
				options={{
					title: "Discover",
					tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
					href: role === "client" ? "/(app)/(tabs)/discover" : null,
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
