import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPoseidon } from "circomlibjs";
import * as snarkjs from "snarkjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const poseidon = await buildPoseidon();

const age = 21n;
const ageSalt = 991n;
const gpa = 38n;
const gpaSalt = 772n;
const ageHash = poseidon.F.toObject(poseidon([age, ageSalt]));
const gpaHash = poseidon.F.toObject(poseidon([gpa, gpaSalt]));

const input = {
  age: age.toString(),
  ageSalt: ageSalt.toString(),
  gpa: gpa.toString(),
  gpaSalt: gpaSalt.toString(),
  ageHash: ageHash.toString(),
  gpaHash: gpaHash.toString(),
  ageThreshold: "18",
  gpaThreshold: "35",
};

console.log("proving…", input);
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  input,
  join(root, "public/zk/predicates.wasm"),
  join(root, "public/zk/predicates.zkey"),
);
const vkey = JSON.parse(
  await readFile(join(root, "public/zk/verification_key.json"), "utf8"),
);
const ok = await snarkjs.groth16.verify(vkey, publicSignals, proof);
console.log("publicSignals", publicSignals);
console.log("verified", ok);
if (!ok) process.exit(1);
process.exit(0);
