import type { UserRole } from "@therapysync/shared";
import { create } from "zustand";

type AuthState = {
	dbUser: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		role: UserRole;
		avatarUrl: string | null;
	} | null;
	setDbUser: (user: AuthState["dbUser"]) => void;
	clearDbUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
	dbUser: null,
	setDbUser: (user) => set({ dbUser: user }),
	clearDbUser: () => set({ dbUser: null }),
}));
