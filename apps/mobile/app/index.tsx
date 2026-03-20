import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function Index() {
	const { isSignedIn, isLoaded } = useAuth();

	if (!isLoaded) return null;

	if (isSignedIn) {
		return <Redirect href="/(app)/(tabs)/schedule" />;
	}

	return <Redirect href="/(auth)/sign-in" />;
}
