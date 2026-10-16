import { Router } from "express";
import { config } from "../config";
import { resolveFeatureFlags } from "../services/featureFlags";

export const flagsRouter = Router();

/**
 * GET /api/v1/flags
 *
 * Returns the current feature-flag set (see
 * src/services/featureFlags.ts for the typed shape and defaults).
 * Unauthenticated and uncached by design: a client should be able to
 * check this before the user has signed in, and flags can change without
 * a client redeploy.
 */
flagsRouter.get("/", (_req, res) => {
  res.json({ flags: resolveFeatureFlags(config.FEATURE_FLAGS) });
});
