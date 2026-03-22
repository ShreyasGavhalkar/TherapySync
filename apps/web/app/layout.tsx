import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "TherapySync",
	description: "Therapy practice management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<ClerkProvider>
			<html lang="en">
				<body className="bg-gray-50 min-h-screen">{children}</body>
			</html>
		</ClerkProvider>
	);
}
