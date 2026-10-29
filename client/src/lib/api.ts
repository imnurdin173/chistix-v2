interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL belum diisi di .env.local — restart dev server setelah mengisi");
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...init,           // nanti dipakai untuk Authorization header (fase auth)
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !body.success) {
    throw new Error(body.message ?? `Request gagal: ${res.status}`);
  }

  return body.data;
}