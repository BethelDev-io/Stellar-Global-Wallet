import { NextFunction, Request, Response } from "express";
import {
  AppError,
  InternalServerError,
  PayloadTooLargeError,
  isAppError,
} from "../errors/appError";
import { SorobanTransactionError } from "../services/sorobanErrors";

/**
 * Pre-existing gap found while wiring up the per-route JSON body limits
 * (issue: "Raise the JSON body limit where needed"): a library-thrown
 * error — e.g. body-parser's 413 when a request exceeds `express.json`'s
 * `limit` — isn't an instance of this app's `AppError`, so it used to fall
 * straight into the `InternalServerError` branch below and always came
 * back as a 500 "Internal server error", hiding a perfectly good 413 (or
 * body-parser's 400 for malformed JSON) behind the wrong status and a
 * misleading message. Only 4xx is passed through here — an unexpected 5xx
 * from a dependency, or a bug in our own code, still always surfaces as
 * our own 500 rather than whatever status a dependency happened to set.
 */
function clientErrorStatus(error: Error): number | null {
  const status = (error as { status?: unknown }).status ?? (error as { statusCode?: unknown }).statusCode;
  return typeof status === "number" && status >= 400 && status < 500 ? status : null;
}

// body-parser (via express.json({ limit })) rejects an oversized body with
// a plain Error that carries `type: "entity.too.large"` and `status: 413`
// — it is not one of our AppError subclasses. Before this fix, that fell
// through to the generic `error instanceof Error` branch below and was
// reported as a 500 INTERNAL_ERROR, which is both the wrong status code
// and hides a client mistake (an oversized request) behind a "server
// failure" code. Pre-existing gap, fixed here because issue #124's error
// examples (docs/openapi-errors.yaml) need the documented 413 response to
// match what the API actually returns.
function isPayloadTooLargeError(error: unknown): error is Error & { status?: number; type?: string } {
  return (
    error instanceof Error &&
    ((error as { type?: string }).type === "entity.too.large" ||
      (error as { status?: number }).status === 413)
  );
}

function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (isPayloadTooLargeError(error)) {
    return new PayloadTooLargeError();
  }

  if (error instanceof Error) {
    const status = clientErrorStatus(error);
    if (status !== null) {
      const type = (error as { type?: unknown }).type;
      const code = typeof type === "string" ? type.toUpperCase().replace(/[^A-Z0-9]+/g, "_") : "REQUEST_ERROR";
      return new AppError(error.message, { code, status });
    }
    return new InternalServerError(error.message);
  }

  return new InternalServerError();
}

function toErrorBody(error: AppError) {
  const body: Record<string, unknown> = {
    code: error.code,
    error: error.message,
  };

  if (error.details !== undefined) {
    body.details = error.details;
  }

  if (error.retryable !== undefined) {
    body.retryable = error.retryable;
  }

  if (error instanceof SorobanTransactionError) {
    body.hash = error.hash;
  }

  return body;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);
  const error = toAppError(err);
  res.status(error.status).json(toErrorBody(error));
}
