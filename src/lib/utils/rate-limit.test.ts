import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, clearRateLimitStore } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("allows requests within the limit and blocks overflow", () => {
    const t0 = 1_000_000;
    expect(checkRateLimit("k1", 2, 60_000, t0)).toMatchObject({ allowed: true, remaining: 1 });
    expect(checkRateLimit("k1", 2, 60_000, t0 + 100)).toMatchObject({ allowed: true, remaining: 0 });
    expect(checkRateLimit("k1", 2, 60_000, t0 + 200)).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("resets counter after window expires", () => {
    const t0 = 1_000_000;
    checkRateLimit("k1", 1, 10_000, t0);
    expect(checkRateLimit("k1", 1, 10_000, t0 + 5_000).allowed).toBe(false);
    expect(checkRateLimit("k1", 1, 10_000, t0 + 10_000).allowed).toBe(true);
  });

  it("isolates different keys", () => {
    const t0 = 1_000_000;
    checkRateLimit("a", 1, 60_000, t0);
    expect(checkRateLimit("a", 1, 60_000, t0).allowed).toBe(false);
    expect(checkRateLimit("b", 1, 60_000, t0).allowed).toBe(true);
  });
});
