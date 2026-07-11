import type { ApiResponse } from "@orchestra/contracts";

export class HttpError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Client-side fetch that unwraps the { ok, data, error } envelope. */
export async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new HttpError("internal_error", `Phản hồi không hợp lệ (${res.status})`);
  }
  if (!body.ok) throw new HttpError(body.error.code, body.error.message);
  return body.data;
}
