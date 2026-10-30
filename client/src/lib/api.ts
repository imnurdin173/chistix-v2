export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public error?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiEnvelope<T> {
  success:boolean;
  message: string;
  data: T;
  errors?: unknown;
}

function getBaseUrl(): string {
  if(typeof window !== "undefined") return "/api";

  const url = process.env.API_URL;
  if(!url) 
    throw new Error("API_URL belum diisi di .env.local");
  return url;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if(init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("COntent-Type", "application/json");
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
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
  
  }

  if(!res.ok || !body?.success) {
    throw new ApiError(
      body?.message || `Request gagal (${res.status})`,
      res.status,
      body?.errors,
    );
  }
  return body.data;
}