import { describe, expect, it } from "vitest";
import { type Clock, DeliveryCache } from "../src/infrastructure/deliveryCache.js";

describe("delivery cache", () => {
  it("expires deliveries after the configured TTL", () => {
    let now = 1_000;
    const clock: Clock = { now: () => now };
    const cache = new DeliveryCache(500, 10, clock);

    cache.add("delivery-1");
    expect(cache.has("delivery-1")).toBe(true);
    now = 1_500;
    expect(cache.has("delivery-1")).toBe(false);
  });

  it("bounds the number of retained deliveries", () => {
    const cache = new DeliveryCache(10_000, 2, { now: () => 1_000 });
    cache.add("delivery-1");
    cache.add("delivery-2");
    cache.add("delivery-3");

    expect(cache.has("delivery-1")).toBe(false);
    expect(cache.has("delivery-2")).toBe(true);
    expect(cache.has("delivery-3")).toBe(true);
  });
});
