const MASK64 = (1n << 64n) - 1n;

function hash64shift(input: bigint): bigint {
  let key = input & MASK64;
  key = (((~key) & MASK64) + ((key << 21n) & MASK64)) & MASK64;
  key = key ^ (key >> 24n);
  key = (((key + ((key << 3n) & MASK64)) & MASK64) + ((key << 8n) & MASK64)) & MASK64;
  key = key ^ (key >> 14n);
  key = (((key + ((key << 2n) & MASK64)) & MASK64) + ((key << 4n) & MASK64)) & MASK64;
  key = key ^ (key >> 28n);
  key = (key + ((key << 31n) & MASK64)) & MASK64;
  return key;
}

export class DartRandom {
  private lo: bigint;
  private hi: bigint;

  constructor(seed: number) {
    const h = hash64shift(BigInt(seed));
    let lo = h & 0xffffffffn;
    const hi = (h >> 32n) & 0xffffffffn;
    if (lo === 0n && hi === 0n) lo = 0x5a17n;
    this.lo = lo;
    this.hi = hi;
    for (let i = 0; i < 4; i++) this.nextState();
  }

  private nextState(): void {
    const t = (0xffffda61n * this.lo + this.hi) & MASK64;
    this.lo = t & 0xffffffffn;
    this.hi = (t >> 32n) & 0xffffffffn;
  }

  private nextInt32(): bigint {
    this.nextState();
    return this.lo;
  }

  nextDouble(): number {
    const a = this.nextInt32() & ((1n << 26n) - 1n);
    const b = this.nextInt32() & ((1n << 27n) - 1n);
    return Number(a * (1n << 27n) + b) / 9007199254740992;
  }
}

export function getAnnualInflationRate(year: number = new Date().getFullYear()): number {
  const rng = new DartRandom(year * 1009);
  const rate = 6.70 + rng.nextDouble() * 1.50;
  return parseFloat(rate.toFixed(2));
}
