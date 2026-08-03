export interface Clock {
  now(): number;
}

const systemClock: Clock = { now: () => Date.now() };

export class DeliveryCache {
  private readonly deliveries = new Map<string, number>();

  constructor(
    private readonly ttlMilliseconds: number,
    private readonly maximumEntries: number,
    private readonly clock: Clock = systemClock,
  ) {}

  has(deliveryId: string): boolean {
    this.prune();
    const expiresAt = this.deliveries.get(deliveryId);
    return expiresAt !== undefined && expiresAt > this.clock.now();
  }

  add(deliveryId: string): void {
    this.prune();
    if (this.deliveries.size >= this.maximumEntries) {
      const oldest = this.deliveries.keys().next().value;
      if (typeof oldest === "string") this.deliveries.delete(oldest);
    }
    this.deliveries.set(deliveryId, this.clock.now() + this.ttlMilliseconds);
  }

  private prune(): void {
    const now = this.clock.now();
    for (const [deliveryId, expiresAt] of this.deliveries) {
      if (expiresAt <= now) this.deliveries.delete(deliveryId);
    }
  }
}
