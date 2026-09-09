import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Groth16Proof } from "./types";

export async function verifyGroth16(
  proof: Groth16Proof,
  publicSignals: string[],
): Promise<boolean> {
  const snarkjs = await import("snarkjs");
  const raw = await readFile(
    join(process.cwd(), "public/zk/verification_key.json"),
    "utf8",
  );
  const vkey = JSON.parse(raw);
  return snarkjs.groth16.verify(vkey, publicSignals, proof);
}
