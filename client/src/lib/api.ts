export type ApiFieldError = {field?: string, path?: string; message: string };

export class ApiError extends Error {
  status: number;
  errors?: ApiFieldError[];

  constructor(message: string, status: number, errors?: ApiFieldError[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: ApiFieldError[];
};

function getBaseUrl(): string {
  if (typeof window !== "undefined") return "/api"; // browser → same-origin proxy
  const base = process.env.API_URL; // server → langsung ke Express
  if (!base) {
    throw new Error(
      "API_URL belum diisi (.env.local lokal / env Vercel client)",
    );
  }
  return base;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    cache: "no-store",
    credentials: "include",
    signal: AbortSignal.timeout(10_000),
    ...init,
    headers,
  });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok || !body?.success) {
    throw new ApiError(
      body?.message || `Request gagal (${res.status})`,
      res.status,
      body?.errors,
    );
  }

  return body.data;
}
