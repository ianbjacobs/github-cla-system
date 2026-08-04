const systemClock = { now: () => Date.now() };
export class DeliveryCache {
  ttlMilliseconds;
  maximumEntries;
  clock;
  deliveries = new Map();
  constructor(ttlMilliseconds, maximumEntries, clock = systemClock) {
    this.ttlMilliseconds = ttlMilliseconds;
    this.maximumEntries = maximumEntries;
    this.clock = clock;
  }
  has(deliveryId) {
    this.prune();
    const expiresAt = this.deliveries.get(deliveryId);
    return expiresAt !== undefined && expiresAt > this.clock.now();
  }
  add(deliveryId) {
    this.prune();
    if (this.deliveries.size >= this.maximumEntries) {
      const oldest = this.deliveries.keys().next().value;
      if (typeof oldest === "string") this.deliveries.delete(oldest);
    }
    this.deliveries.set(deliveryId, this.clock.now() + this.ttlMilliseconds);
  }
  prune() {
    const now = this.clock.now();
    for (const [deliveryId, expiresAt] of this.deliveries) {
      if (expiresAt <= now) this.deliveries.delete(deliveryId);
    }
  }
}
