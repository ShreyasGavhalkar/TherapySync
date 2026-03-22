"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "client" | "therapist";
type Step = "role" | "credentials" | "therapist-details" | "verification";

export default function SignUpPage() {
	const { signUp, setActive, isLoaded } = useSignUp();
	const router = useRouter();

	const [step, setStep] = useState<Step>("role");
	const [role, setRole] = useState<Role>("client");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [certification, setCertification] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");

	const handleCreateAccount = async () => {
		if (!isLoaded) return;
		setLoading(true);
		setError("");

		try {
			const metadata: Record<string, string> = { role };
			if (role === "therapist") {
				metadata.phone = phone;
				metadata.address = address;
				metadata.certification = certification;
			}

			const result = await signUp.create({
				firstName,
				lastName,
				emailAddress: email,
				password,
				unsafeMetadata: metadata,
			});

			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.push("/schedule");
			} else if (result.status === "missing_requirements") {
				await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
				setStep("verification");
			}
		} catch (err: any) {
			setError(err.errors?.[0]?.message ?? "Sign up failed");
		} finally {
			setLoading(false);
		}
	};

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isLoaded) return;
		setLoading(true);
		setError("");

		try {
			const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				router.push("/schedule");
			}
		} catch (err: any) {
			setError(err.errors?.[0]?.message ?? "Verification failed");
		} finally {
			setLoading(false);
		}
	};

	const handleNext = (e?: React.FormEvent) => {
		e?.preventDefault();
		setError("");
		if (step === "role") {
			setStep("credentials");
		} else if (step === "credentials") {
			if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
				setError("Please fill in all fields");
				return;
			}
			if (role === "therapist") {
				setStep("therapist-details");
			} else {
				handleCreateAccount();
			}
		} else if (step === "therapist-details") {
			if (!phone.trim()) { setError("Phone number is required"); return; }
			if (!certification.trim()) { setError("Certification is required"); return; }
			handleCreateAccount();
		}
	};

	const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors";

	// Verification step
	if (step === "verification") {
		return (
			<Shell>
				<h1 className="text-2xl font-bold text-primary text-center mb-2">Verify Email</h1>
				<p className="text-gray-500 text-center mb-6">We sent a code to {email}</p>
				<form onSubmit={handleVerify} className="space-y-4">
					<input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Verification code" className={inputClass} />
					{error && <p className="text-red-600 text-sm">{error}</p>}
					<button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark disabled:opacity-50">{loading ? "Verifying..." : "Verify Email"}</button>
				</form>
			</Shell>
		);
	}

	// Role selection
	if (step === "role") {
		return (
			<Shell>
				<h1 className="text-2xl font-bold text-primary text-center mb-2">TherapySync</h1>
				<p className="text-gray-500 text-center mb-6">How will you use TherapySync?</p>
				<div className="space-y-3 mb-6">
					<button
						type="button"
						onClick={() => setRole("client")}
						className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${role === "client" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
					>
						<p className={`font-semibold ${role === "client" ? "text-primary" : ""}`}>I'm a Client</p>
						<p className="text-sm text-gray-500">I'm looking for a therapist or already seeing one</p>
					</button>
					<button
						type="button"
						onClick={() => setRole("therapist")}
						className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${role === "therapist" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
					>
						<p className={`font-semibold ${role === "therapist" ? "text-primary" : ""}`}>I'm a Therapist</p>
						<p className="text-sm text-gray-500">I provide therapy and want to manage my practice</p>
					</button>
				</div>
				<button type="button" onClick={() => handleNext()} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark">Continue</button>
				<p className="text-center text-sm text-gray-500 mt-4">Already have an account? <a href="/sign-in" className="text-primary hover:underline">Sign In</a></p>
			</Shell>
		);
	}

	// Credentials
	if (step === "credentials") {
		return (
			<Shell>
				<h1 className="text-2xl font-bold text-primary text-center mb-1">Create Account</h1>
				<p className="text-gray-500 text-center mb-6">Signing up as {role === "therapist" ? "a Therapist" : "a Client"}</p>
				<form onSubmit={handleNext} className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" required className={inputClass} />
						<input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required className={inputClass} />
					</div>
					<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={inputClass} />
					<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className={inputClass} />
					{error && <p className="text-red-600 text-sm">{error}</p>}
					<button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark disabled:opacity-50">
						{loading && role === "client" ? "Creating account..." : "Continue"}
					</button>
					<button type="button" onClick={() => setStep("role")} className="w-full text-gray-500 text-sm hover:text-gray-700">Back</button>
				</form>
			</Shell>
		);
	}

	// Therapist details
	return (
		<Shell>
			<h1 className="text-2xl font-bold text-primary text-center mb-1">Professional Details</h1>
			<p className="text-gray-500 text-center mb-6">We need a few more details to set up your practice</p>
			<form onSubmit={handleNext} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
					<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" className={inputClass} />
					<p className="text-xs text-gray-400 mt-1">Clients will see this to contact you</p>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Practice Address</label>
					<input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, State" className={inputClass} />
					<p className="text-xs text-gray-400 mt-1">Helps clients find you by location</p>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Certification / License *</label>
					<input type="text" value={certification} onChange={(e) => setCertification(e.target.value)} placeholder="e.g., Licensed Clinical Psychologist, LCSW" className={inputClass} />
				</div>
				{error && <p className="text-red-600 text-sm">{error}</p>}
				<button type="submit" disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark disabled:opacity-50">
					{loading ? "Creating account..." : "Complete Sign Up"}
				</button>
				<button type="button" onClick={() => setStep("credentials")} className="w-full text-gray-500 text-sm hover:text-gray-700">Back</button>
			</form>
		</Shell>
	);
}

function Shell({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8">
				{children}
			</div>
		</div>
	);
}
