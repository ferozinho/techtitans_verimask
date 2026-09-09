import { execFileSync, execSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const binDir = join(root, "bin");
const artDir = join(root, "artifacts");
const publicZk = join(root, "public", "zk");
const libZk = join(root, "lib", "zk");
const circomBin = join(binDir, "circom");

mkdirSync(binDir, { recursive: true });
mkdirSync(artDir, { recursive: true });
mkdirSync(publicZk, { recursive: true });
mkdirSync(libZk, { recursive: true });

function run(cmd, args, cwd = root) {
  console.log("$", cmd, args.join(" "));
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
}

function snark(args) {
  execSync(`npx --no-install snarkjs ${args}`, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env },
  });
}

if (!existsSync(circomBin)) {
  const url =
    "https://github.com/iden3/circom/releases/download/v2.2.2/circom-linux-amd64";
  console.log("Downloading circom…");
  execSync(`curl -L --fail --retry 3 -o "${circomBin}" "${url}"`, {
    stdio: "inherit",
  });
  chmodSync(circomBin, 0o755);
}

rmSync(join(artDir, "predicates_js"), { recursive: true, force: true });

run(circomBin, [
  "circuits/predicates.circom",
  "--r1cs",
  "--wasm",
  "--sym",
  "-o",
  "artifacts",
  "-l",
  "node_modules/circomlib/circuits",
]);

const ptau0 = join(artDir, "pot12_0000.ptau");
const ptau1 = join(artDir, "pot12_0001.ptau");
const ptau = join(artDir, "pot12_final.ptau");
const zkey0 = join(artDir, "predicates_0000.zkey");
const zkey = join(artDir, "predicates.zkey");
const r1cs = join(artDir, "predicates.r1cs");
const vkey = join(artDir, "verification_key.json");

snark(`powersoftau new bn128 12 ${ptau0} -v`);
snark(
  `powersoftau contribute ${ptau0} ${ptau1} --name="verimask" -e="verimask-dev-entropy"`,
);
snark(`powersoftau prepare phase2 ${ptau1} ${ptau} -v`);
snark(`groth16 setup ${r1cs} ${ptau} ${zkey0}`);
snark(
  `zkey contribute ${zkey0} ${zkey} --name="verimask" -e="verimask-dev-entropy"`,
);
snark(`zkey export verificationkey ${zkey} ${vkey}`);

copyFileSync(join(artDir, "predicates_js", "predicates.wasm"), join(publicZk, "predicates.wasm"));
copyFileSync(zkey, join(publicZk, "predicates.zkey"));
copyFileSync(vkey, join(publicZk, "verification_key.json"));
copyFileSync(vkey, join(libZk, "verification_key.json"));

console.log("ZK artifacts written to public/zk and lib/zk");
