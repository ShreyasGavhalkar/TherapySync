"use client";

import { createContext, useContext } from "react";

type UserContextType = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	avatarUrl: string | null;
} | null;

const UserContext = createContext<UserContextType>(null);

export function UserProvider({ user, children }: { user: UserContextType; children: React.ReactNode }) {
	return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
	return useContext(UserContext);
}
