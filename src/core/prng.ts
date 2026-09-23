/**
 * Pseudo-Random Number Generator (PRNG)
 * Deterministic, seedable implementation for reproducible battles.
 * CONTRACT §3.1.7: NO imports from Phaser, Matter.js, or DOM APIs.
 */

export class PRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0; // Ensure unsigned 32-bit integer
  }

  /**
   * Returns a pseudo-random float in [0, 1)
   */
  nextFloat(): number {
    // Linear Congruential Generator (LCG)
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }

  /**
   * Returns a pseudo-random integer in [min, max] (inclusive)
   */
  nextInt(min: number, max: number): number {
    if (min > max) {
      [min, max] = [max, min];
    }
    const range = max - min + 1;
    return Math.floor(this.nextFloat() * range) + min;
  }

  /**
   * Fisher-Yates shuffle (in-place)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = array[i];
      array[i] = array[j]!;
      array[j] = temp!;
    }
    return array;
  }

  /**
   * Pick a random element from an array
   */
  pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Reset the PRNG to a new seed
   */
  reseed(seed: number): void {
    this.seed = seed >>> 0;
  }
}
