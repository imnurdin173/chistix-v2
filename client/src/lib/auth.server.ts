import { redirect } from "next/navigation";
import { ApiError } from "./api";
import { apiFetchServer } from "./api.server";
import { cache } from "react";
import type { AuthUser } from "@/components/providers/auth-provider";

// Shape of GET /api/profile/me
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ORGANIZER";
  avatar: string | null;
  points: number;
  referralCode: string;
  createdAt: string;
};

const ME_PATH = "/auth/me";

// Call at the top of every customer-only page (server side).
// Not logged in → /error/401, wrong role → /error/403.
export async function requireCustomer(): Promise<CurrentUser> {
  let user: CurrentUser;

  try {
    user = await apiFetchServer<CurrentUser>("/profile/me");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      redirect("/error/401");
    }
    throw error; // other problems (backend down, etc.) → Next.js error page
  }

  if (user.role !== "CUSTOMER") {
    redirect("/error/403");
  }

  return user;
}

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const payload = await apiFetchServer<AuthUser | { user: AuthUser } | null>(ME_PATH);
    return payload && "user" in payload ? payload.user : (payload as AuthUser | null);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err; 
  }
});