import request from "supertest";
import { createApp } from "../../src/app";
import { StellarService } from "../../src/services/stellar";
import { parseCompositeCursor, encodeCompositeCursor } from "../../src/services/activityFeed";

describe("GET /api/v1/account/:publicKey/activity (issue #79)", () => {
  const VALID_G_ADDRESS = "GBZH7QMRVYFLVYQRY6O5SOM3G7MSQF7MMUEM3WUOGRV26W3R3K5M7G8A";

  it("returns a unified activity feed ordered by timestamp descending", async () => {
    const mockPayments = [
      {
        id: "pay-1",
        type: "payment",
        transactionHash: "tx1",
        createdAt: "2026-10-17T10:00:00Z",
        from: VALID_G_ADDRESS,
        to: "GTO",
        amount: "100",
        flags: [],
      },
      {
        id: "pay-2",
        type: "payment",
        transactionHash: "tx2",
        createdAt: "2026-10-17T11:00:00Z",
        from: "GFROM",
        to: VALID_G_ADDRESS,
        amount: "50",
        flags: [],
      },
    ];

    const stellar = {
      getPaymentHistory: jest.fn().mockResolvedValue({
        payments: mockPayments,
        next: "cursor-next",
        hasMore: true,
      }),
    } as unknown as StellarService;

    const app = createApp(stellar);

    const res = await request(app)
      .get(`/api/v1/account/${VALID_G_ADDRESS}/activity?limit=10`)
      .expect(200);

    expect(res.body).toHaveProperty("items");
    expect(res.body.items).toHaveLength(2);
    // Ordered descending by timestamp: pay-2 (11:00) before pay-1 (10:00)
    expect(res.body.items[0].id).toBe("pay-2");
    expect(res.body.items[1].id).toBe("pay-1");
    expect(res.body.hasMore).toBe(true);
    expect(res.body.next).toBeDefined();
  });

  it("handles equal timestamps stably with deterministic tie-breaking by id", async () => {
    const mockPayments = [
      {
        id: "pay-a",
        type: "payment",
        transactionHash: "txA",
        createdAt: "2026-10-17T12:00:00Z",
        from: VALID_G_ADDRESS,
        to: "GTO",
        amount: "10",
        flags: [],
      },
      {
        id: "pay-b",
        type: "payment",
        transactionHash: "txB",
        createdAt: "2026-10-17T12:00:00Z",
        from: VALID_G_ADDRESS,
        to: "GTO",
        amount: "20",
        flags: [],
      },
    ];

    const stellar = {
      getPaymentHistory: jest.fn().mockResolvedValue({
        payments: mockPayments,
        next: undefined,
        hasMore: false,
      }),
    } as unknown as StellarService;

    const app = createApp(stellar);

    const res = await request(app)
      .get(`/api/v1/account/${VALID_G_ADDRESS}/activity`)
      .expect(200);

    expect(res.body.items[0].id).toBe("pay-b");
    expect(res.body.items[1].id).toBe("pay-a");
  });

  it("correctly parses and applies composite cursor for pagination", async () => {
    const cursor = encodeCompositeCursor({ horizonCursor: "horiz-99", eventId: "ev-12" });
    const stellar = {
      getPaymentHistory: jest.fn().mockResolvedValue({
        payments: [],
        next: undefined,
        hasMore: false,
      }),
    } as unknown as StellarService;

    const app = createApp(stellar);

    await request(app)
      .get(`/api/v1/account/${VALID_G_ADDRESS}/activity?cursor=${cursor}`)
      .expect(200);

    expect(stellar.getPaymentHistory).toHaveBeenCalledWith(VALID_G_ADDRESS, {
      limit: 20,
      cursor: "horiz-99",
    });
  });

  it("rejects an invalid public key with 400", async () => {
    const stellar = { getPaymentHistory: jest.fn() } as unknown as StellarService;
    const app = createApp(stellar);

    await request(app).get("/api/v1/account/invalid-key/activity").expect(400);
    expect(stellar.getPaymentHistory).not.toHaveBeenCalled();
  });
});
