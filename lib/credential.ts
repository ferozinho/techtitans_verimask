import { ageFromDob, fieldCommitment, randomHex, signPayload } from "./crypto";
import type {
  ClaimMeta,
  HolderBundle,
  HolderSecrets,
  IssuerProfile,
  SignedCredential,
} from "./types";

export function issueCredential(input: {
  issuer: IssuerProfile;
  templateId: string;
  claims: { id: string; label: string; value: string }[];
}): HolderBundle {
  const filled = input.claims
    .map((c) => ({
      id: c.id.trim(),
      label: c.label.trim() || c.id,
      value: c.value.trim(),
    }))
    .filter((c) => c.id && c.value);

  const dob = filled.find((c) => c.id === "dateOfBirth")?.value;
  if (dob && !filled.some((c) => c.id === "over18")) {
    filled.push({
      id: "over18",
      label: "Age 18+",
      value: ageFromDob(dob) >= 18 ? "yes" : "no",
    });
  }

  const schema: ClaimMeta[] = filled.map(({ id, label }) => ({ id, label }));
  const secrets: HolderSecrets = {};
  const commitments: Record<string, string> = {};
  for (const claim of filled) {
    const salt = randomHex(16);
    secrets[claim.id] = { value: claim.value, salt };
    commitments[claim.id] = fieldCommitment(claim.value, salt);
  }

  const unsigned = {
    id: `urn:verimask:${randomHex(8)}`,
    type: "IdentityCredential" as const,
    issuerDid: input.issuer.did,
    issuerPublicKey: input.issuer.publicKey,
    issuedAt: new Date().toISOString(),
    issuerName: input.issuer.issuerName,
    templateId: input.templateId,
    schema,
    commitments,
  };

  const signature = signPayload(unsigned, input.issuer.secretKey);
  const credential: SignedCredential = { ...unsigned, signature };
  return { credential, secrets };
}

export function claimIds(bundle: HolderBundle): string[] {
  return bundle.credential.schema.map((c) => c.id);
}

export function claimLabel(bundle: HolderBundle, id: string): string {
  return bundle.credential.schema.find((c) => c.id === id)?.label ?? id;
}

export function labelsFromSchema(schema: ClaimMeta[]): Record<string, string> {
  return Object.fromEntries(schema.map((c) => [c.id, c.label]));
}
