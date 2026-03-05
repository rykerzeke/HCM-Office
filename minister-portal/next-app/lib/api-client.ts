import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";
const AUTH_COOKIE = "auth_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAuthToken(): Promise<string | undefined> {
  try {
    const jar = await cookies();
    return jar.get(AUTH_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  searchParams?: Record<string, string>
): Promise<T> {
  const url = new URL(path, BACKEND_URL.endsWith("/") ? BACKEND_URL : BACKEND_URL + "/");

  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const token = await getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    let errorBody: { error?: string; code?: string } = {};
    try {
      errorBody = await res.json();
    } catch {
      /* empty */
    }
    throw new ApiError(
      res.status,
      errorBody.code ?? "UNKNOWN",
      errorBody.error ?? `Request failed with status ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

export function apiGet<T>(
  path: string,
  searchParams?: Record<string, string>
): Promise<T> {
  return request<T>("GET", path, undefined, searchParams);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}
