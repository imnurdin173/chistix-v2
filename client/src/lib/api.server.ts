import { cookies } from "next/headers";
import { apiFetch } from "./api";

export async function apiFetchServer<T>(path: string, init: RequestInit = {}): Promise<T> {
    const cookieStore = await cookies();
    return apiFetch<T>(path, {
        ...init,
        headers: {
            ...(init.headers ?? {}),
            Cookie: cookieStore.toString(),
        }
    });
}