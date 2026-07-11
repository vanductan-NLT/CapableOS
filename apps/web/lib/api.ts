import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiErrorCode, ApiResponse } from "@orchestra/contracts";

const STATUS: Record<ApiErrorCode, number> = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  upstream_error: 502,
  internal_error: 500,
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data } satisfies ApiResponse<T>, init);
}

export function fail(code: ApiErrorCode, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } } satisfies ApiResponse<never>, {
    status: STATUS[code],
  });
}

/** Thrown inside a handler to short-circuit with a typed envelope error. */
export class ApiFail extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

type Handler<C> = (req: Request, ctx: C) => Promise<NextResponse> | NextResponse;

/** Wraps a route handler: catches ApiFail/ZodError/unknown → envelope. */
export function route<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ApiFail) return fail(e.code, e.message);
      if (e instanceof z.ZodError) return fail("validation_error", e.issues[0]?.message ?? "Invalid input");
      const msg = e instanceof Error ? e.message : "Unexpected error";
      // Missing-env → clearer message for the founder wiring Supabase.
      if (/Missing env/.test(msg)) return fail("internal_error", msg);
      return fail("internal_error", msg);
    }
  };
}

/** Parse + validate a JSON body against a zod schema (throws ZodError → 400). */
export async function jsonBody<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiFail("validation_error", "Body phải là JSON hợp lệ");
  }
  return schema.parse(raw);
}
