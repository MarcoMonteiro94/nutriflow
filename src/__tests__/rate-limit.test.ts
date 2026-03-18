import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows first request", () => {
    const result = checkRateLimit("test-unique-1", { limit: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("tracks request count", () => {
    const key = "test-count-" + Date.now();
    checkRateLimit(key, { limit: 3, windowSeconds: 60 });
    checkRateLimit(key, { limit: 3, windowSeconds: 60 });
    const result = checkRateLimit(key, { limit: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks after limit exceeded", () => {
    const key = "test-block-" + Date.now();
    const config = { limit: 2, windowSeconds: 60 };
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("different keys are independent", () => {
    const config = { limit: 1, windowSeconds: 60 };
    const key1 = "test-independent-a-" + Date.now();
    const key2 = "test-independent-b-" + Date.now();
    checkRateLimit(key1, config);
    const result = checkRateLimit(key2, config);
    expect(result.allowed).toBe(true);
  });
});
