import {
  generateDemoAccounts,
  seedDemoWallet,
  formatSummaryMarkdown,
} from "../../scripts/seed-demo-wallet";

describe("seedDemoWallet script (issue #85)", () => {
  it("generates deterministic accounts for all 5 roles", () => {
    const accounts = generateDemoAccounts();

    expect(Object.keys(accounts)).toEqual([
      "owner",
      "guardian_1",
      "guardian_2",
      "guardian_3",
      "recovery_target",
    ]);

    for (const [role, acc] of Object.entries(accounts)) {
      expect(acc.role).toBe(role);
      expect(acc.publicKey).toMatch(/^G[A-Z0-9]{55}$/);
      expect(acc.secretKey).toMatch(/^S[A-Z0-9]{55}$/);
      expect(typeof acc.description).toBe("string");
    }

    // Re-running produces identical keys (idempotency)
    const secondRun = generateDemoAccounts();
    expect(secondRun.owner.publicKey).toBe(accounts.owner.publicKey);
    expect(secondRun.guardian_1.publicKey).toBe(accounts.guardian_1.publicKey);
    expect(secondRun.guardian_2.publicKey).toBe(accounts.guardian_2.publicKey);
    expect(secondRun.guardian_3.publicKey).toBe(accounts.guardian_3.publicKey);
    expect(secondRun.recovery_target.publicKey).toBe(accounts.recovery_target.publicKey);
  });

  it("runs cleanly in dry-run mode without external network calls", async () => {
    const state = await seedDemoWallet({ dryRun: true });

    expect(state.network).toBe("testnet");
    expect(state.assets.length).toBe(2);
    expect(state.assets.some((a) => a.code === "XLM")).toBe(true);
    expect(state.assets.some((a) => a.code === "USDC")).toBe(true);
    expect(state.guardians.length).toBe(3);
    expect(state.recovery.threshold).toBe(2);
    expect(state.recovery.isPending).toBe(true);
    expect(state.recovery.pendingCandidate).toBe(state.accounts.recovery_target.publicKey);
  });

  it("formats markdown summary tables containing all roles and addresses", async () => {
    const state = await seedDemoWallet({ dryRun: true });
    const markdown = formatSummaryMarkdown(state);

    expect(markdown).toContain("Testnet Demo Accounts Matrix");
    expect(markdown).toContain("Primary Demo User / Wallet Owner");
    expect(markdown).toContain("Recovery Guardian 1");
    expect(markdown).toContain("Recovery Guardian 2");
    expect(markdown).toContain("Recovery Guardian 3");
    expect(markdown).toContain("Recovery Target (New Candidate Admin)");
    expect(markdown).toContain(state.accounts.owner.publicKey);
    expect(markdown).toContain(state.accounts.guardian_1.publicKey);
    expect(markdown).toContain(state.accounts.recovery_target.publicKey);
    expect(markdown).toContain("Configured Assets & Daily Limits");
    expect(markdown).toContain("Social Recovery State");
  });
});
