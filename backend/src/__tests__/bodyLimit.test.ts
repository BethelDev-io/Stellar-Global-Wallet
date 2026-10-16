/**
 * express.json body size limits (issue: "Raise the JSON body limit where
 * needed (XDR envelopes) and document limits").
 *
 * The global default is 10kb. `/wallet/fee-bump` and
 * `/wallet/submit-multisig` are the two routes that accept a transaction
 * XDR envelope — a multi-signed envelope or a fee-bump wrapping one can
 * comfortably exceed a few KB — so they get a 64kb limit instead. This
 * suite checks both the large-valid-payload path for those two routes and
 * the 413 rejection path for an unlisted route still bound by the 10kb
 * default.
 */
jest.mock("../services/stellar", () => {
  return {
    StellarService: jest.fn().mockImplementation(() => ({
      feeBumpTransaction: jest.fn().mockResolvedValue({ hash: "feebumphash", successful: true }),
      submitWithAdditionalSignatures: jest
        .fn()
        .mockResolvedValue({ hash: "multisighash", successful: true }),
      sendPayment: jest.fn(),
      generateKeypair: jest.fn(),
    })),
  };
});

jest.mock("../services/idempotency", () => ({
  getCachedResult: jest.fn().mockResolvedValue(null),
  cacheResult: jest.fn().mockResolvedValue(undefined),
}));

import request from "supertest";
import { createApp } from "../app";
import { generateAccessToken } from "../utils/jwt";

const app = createApp();
const token = generateAccessToken("test-user");
const SECRET_KEY = "S".padEnd(56, "A");

// Padding well past the 10kb default but safely under the 64kb override.
function padded(prefix: string, targetBytes: number): string {
  return prefix + "X".repeat(Math.max(0, targetBytes - prefix.length));
}

describe("JSON body size limits", () => {
  it("accepts a large (>10kb, <64kb) XDR payload on /wallet/fee-bump", async () => {
    const res = await request(app)
      .post("/api/v1/wallet/fee-bump")
      .set("Authorization", `Bearer ${token}`)
      .send({
        transactionXdr: padded("AAAAAg", 20_000),
        feeSecretKey: SECRET_KEY,
      });

    expect(res.status).toBe(200);
    expect(res.body.hash).toBe("feebumphash");
  });

  it("accepts a large (>10kb, <64kb) XDR payload on /wallet/submit-multisig", async () => {
    const res = await request(app)
      .post("/api/v1/wallet/submit-multisig")
      .set("Authorization", `Bearer ${token}`)
      .send({
        xdr: padded("AAAAAg", 20_000),
        signerSecretKeys: [SECRET_KEY],
      });

    expect(res.status).toBe(200);
    expect(res.body.hash).toBe("multisighash");
  });

  it("rejects a payload over 64kb on /wallet/submit-multisig with 413", async () => {
    const res = await request(app)
      .post("/api/v1/wallet/submit-multisig")
      .set("Authorization", `Bearer ${token}`)
      .send({
        xdr: padded("AAAAAg", 70_000),
        signerSecretKeys: [SECRET_KEY],
      });

    expect(res.status).toBe(413);
  });

  it("rejects a payload over the 10kb default on a route without an override (413)", async () => {
    const res = await request(app)
      .post("/api/v1/wallet/send")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sourceSecretKey: SECRET_KEY,
        destinationPublicKey: "G".padEnd(56, "B"),
        amount: "1",
        memo: padded("", 15_000),
      });

    expect(res.status).toBe(413);
  });
});
