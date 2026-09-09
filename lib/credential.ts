import { AGE_THRESHOLD, GPA_TENTHS_THRESHOLD } from "./constants";
import {
  ageFromDob,
  fieldCommitment,
  gpaToTenths,
  randomHex,
  saltToField,
  signPayload,
} from "./crypto";
import { poseidon2 } from "./poseidon";
import type {
  FieldKey,
  HolderBundle,
  HolderSecrets,
  IssuerProfile,
  SignedCredential,
} from "./types";

export async function issueCredential(input: {
  issuer: IssuerProfile;
  name: string;
  dob: string;
  gpa: number;
  degree: string;
  program: string;
}): Promise<HolderBundle> {
  const age = ageFromDob(input.dob);
  const gpaTenths = gpaToTenths(input.gpa);

  const secrets: HolderSecrets = {
    name: { value: input.name.trim(), salt: randomHex(16) },
    degree: { value: input.degree.trim(), salt: randomHex(16) },
    program: { value: input.program.trim(), salt: randomHex(16) },
    dob: input.dob,
    age: { value: age, salt: randomHex(16) },
    gpaTenths: { value: gpaTenths, salt: randomHex(16) },
  };

  const ageHash = await poseidon2(BigInt(age), saltToField(secrets.age.salt));
  const gpaHash = await poseidon2(
    BigInt(gpaTenths),
    saltToField(secrets.gpaTenths.salt),
  );

  const unsigned = {
    id: `urn:verimask:${randomHex(8)}`,
    type: "StudentCredential" as const,
    issuerDid: input.issuer.did,
    issuerPublicKey: input.issuer.publicKey,
    issuedAt: new Date().toISOString(),
    college: input.issuer.college,
    commitments: {
      name: fieldCommitment(secrets.name.value, secrets.name.salt),
      age: ageHash.toString(),
      gpa: gpaHash.toString(),
      degree: fieldCommitment(secrets.degree.value, secrets.degree.salt),
      program: fieldCommitment(secrets.program.value, secrets.program.salt),
    },
  };

  const signature = signPayload(unsigned, input.issuer.secretKey);
  const credential: SignedCredential = { ...unsigned, signature };

  return { credential, secrets };
}

export function openDisclosures(
  bundle: HolderBundle,
  keys: FieldKey[],
): Partial<Record<FieldKey, { value: string; salt: string }>> {
  const out: Partial<Record<FieldKey, { value: string; salt: string }>> = {};
  for (const key of keys) out[key] = bundle.secrets[key];
  return out;
}

export function meetsPredicates(bundle: HolderBundle): {
  age: boolean;
  gpa: boolean;
} {
  return {
    age: bundle.secrets.age.value >= AGE_THRESHOLD,
    gpa: bundle.secrets.gpaTenths.value >= GPA_TENTHS_THRESHOLD,
  };
}
