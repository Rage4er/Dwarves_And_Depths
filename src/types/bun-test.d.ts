// Минимальная заглушка типов bun:test (пакет @types/bun недоступен в оффлайн-среде)

declare module 'bun:test' {
  export interface TestFn { (): void | Promise<void> }
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export const it: typeof test;
  export function expect(value: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toContain(expected: unknown): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    readonly not: ReturnType<typeof expect> extends infer E ? E : never;
  };
}
