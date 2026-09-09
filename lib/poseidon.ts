import { buildPoseidon } from "circomlibjs";

type Poseidon = Awaited<ReturnType<typeof buildPoseidon>>;

let poseidonPromise: Promise<Poseidon> | null = null;

export function getPoseidon(): Promise<Poseidon> {
  if (!poseidonPromise) poseidonPromise = buildPoseidon();
  return poseidonPromise;
}

export async function poseidon2(a: bigint, b: bigint): Promise<bigint> {
  const poseidon = await getPoseidon();
  return poseidon.F.toObject(poseidon([a, b]));
}
