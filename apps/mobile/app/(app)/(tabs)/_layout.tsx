import { Tabs } from "expo-router";
import { Platform, useColorScheme } from "react-native";
import { BlurView } from "expo-blur";
import { useAuthStore } from "@/lib/auth-store";
import { useThemeStore } from "@/lib/theme-store";
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
	const systemScheme = useColorScheme();
	const themeMode = useThemeStore((s) => s.mode);
	const isDark = (themeMode === "system" ? systemScheme : themeMode) === "dark";

	const bg = isDark ? "#111827" : "#F8F9FA";
	const headerBg = isDark ? "#111827" : "#6C63FF";

	// Use blur on iOS 13+, fallback to solid on older/Android
	const supportsBlur = Platform.OS === "ios";

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: "#6C63FF",
				tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
				headerStyle: { backgroundColor: headerBg },
				headerTintColor: "#fff",
				sceneStyle: { backgroundColor: bg },
				...(supportsBlur
					? {
							tabBarStyle: {
								position: "absolute",
								borderTopWidth: 0,
								elevation: 0,
								backgroundColor: "transparent",
							},
							tabBarBackground: () => (
								<BlurView
									tint={isDark ? "dark" : "light"}
									intensity={80}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
									}}
								/>
							),
						}
					: {
							tabBarStyle: {
								backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
								borderTopColor: isDark ? "#374151" : "#E5E7EB",
							},
						}),
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
