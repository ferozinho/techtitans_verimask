declare module "circomlibjs" {
  export function buildPoseidon(): Promise<{
    F: { toObject: (value: unknown) => bigint };
    (inputs: (bigint | number | string)[]): unknown;
  }>;
}
