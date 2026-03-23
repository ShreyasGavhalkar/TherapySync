import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
			<div className="text-center">
				<h1 className="text-3xl font-bold text-primary mb-8">TherapySync</h1>
				<SignIn />
			</div>
		</div>
	);
}
