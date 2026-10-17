import { Router } from "express";
import { param, query } from "express-validator";
import { assertValidRequest } from "../middleware/requestValidation";
import { StellarService } from "../services/stellar";
import { getUnifiedActivityFeed } from "../services/activityFeed";
import { isGAddress, publicKeyMessage } from "../utils/stellarAddress";

export function createAccountRouter(stellar: StellarService): Router {
  const accountRouter = Router();

  accountRouter.get(
    "/:publicKey",
    param("publicKey").custom(isGAddress).withMessage(publicKeyMessage),
    async (req, res, next) => {
      try {
        assertValidRequest(req);
        const account = await stellar.getAccount(req.params.publicKey);
        res.json(account);
      } catch (err) {
        next(err);
      }
    }
  );

  accountRouter.get(
    "/:publicKey/balances",
    param("publicKey").custom(isGAddress).withMessage(publicKeyMessage),
    async (req, res, next) => {
      try {
        assertValidRequest(req);
        const balances = await stellar.getBalances(req.params.publicKey);
        res.json({ balances });
      } catch (err) {
        next(err);
      }
    }
  );

  accountRouter.get(
    "/:publicKey/transactions",
    param("publicKey").custom(isGAddress).withMessage(publicKeyMessage),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit must be an integer between 1 and 100")
      .toInt(),
    async (req, res, next) => {
      try {
        assertValidRequest(req);
        const limit = (req.query.limit as number | undefined) ?? 20;
        const cursor = req.query.cursor as string | undefined;
        const result = await stellar.getTransactions(req.params.publicKey, { limit, cursor });
        res.json({ 
          transactions: result.transactions,
          next: result.next,
          hasMore: result.hasMore,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // #105 — activity feed with suspicious-payment flags (dust, memo_url,
  // unknown_asset). Separate from GET /:publicKey/transactions (which stays
  // on Horizon's transaction-level records) because flagging needs the
  // per-payment amount/asset Horizon only returns from /payments.
  accountRouter.get(
    "/:publicKey/payments",
    param("publicKey").custom(isGAddress).withMessage(publicKeyMessage),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit must be an integer between 1 and 100")
      .toInt(),
    async (req, res, next) => {
      try {
        assertValidRequest(req);
        const limit = (req.query.limit as number | undefined) ?? 20;
        const cursor = req.query.cursor as string | undefined;
        const result = await stellar.getPaymentHistory(req.params.publicKey, { limit, cursor });
        res.json({
          payments: result.payments,
          next: result.next,
          hasMore: result.hasMore,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // #79 — activity feed combining classic payments and Soroban contract events
  accountRouter.get(
    "/:publicKey/activity",
    param("publicKey").custom(isGAddress).withMessage(publicKeyMessage),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit must be an integer between 1 and 100")
      .toInt(),
    async (req, res, next) => {
      try {
        assertValidRequest(req);
        const limit = (req.query.limit as number | undefined) ?? 20;
        const cursor = req.query.cursor as string | undefined;
        const result = await getUnifiedActivityFeed({
          publicKey: req.params.publicKey,
          limit,
          cursor,
          stellar,
        });
        res.json(result);
      } catch (err) {
        next(err);
      }
    }
  );

  return accountRouter;
}
