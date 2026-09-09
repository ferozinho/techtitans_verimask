import type { Groth16Proof } from "./types";

const WASM = "/zk/predicates.wasm";
const ZKEY = "/zk/predicates.zkey";

export async function provePredicates(input: {
  age: bigint;
  ageSalt: bigint;
  gpa: bigint;
  gpaSalt: bigint;
  ageHash: bigint;
  gpaHash: bigint;
  ageThreshold: bigint;
  gpaThreshold: bigint;
}): Promise<{ proof: Groth16Proof; publicSignals: string[] }> {
  const snarkjs = await import("snarkjs");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
      age: input.age.toString(),
      ageSalt: input.ageSalt.toString(),
      gpa: input.gpa.toString(),
      gpaSalt: input.gpaSalt.toString(),
      ageHash: input.ageHash.toString(),
      gpaHash: input.gpaHash.toString(),
      ageThreshold: input.ageThreshold.toString(),
      gpaThreshold: input.gpaThreshold.toString(),
    },
    WASM,
    ZKEY,
  );
  return { proof: proof as Groth16Proof, publicSignals };
}
