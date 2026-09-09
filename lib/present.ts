import { PRESENTATION_TTL_MS } from "./constants";
import { generateKeypair, saltToField, signPayload } from "./crypto";
import { provePredicates } from "./zk-prove";
import type { FieldKey, HolderBundle, Presentation, SessionRequest } from "./types";

export async function buildPresentation(opts: {
  bundle: HolderBundle;
  sessionId: string;
  request: SessionRequest;
  disclose: FieldKey[];
}): Promise<Presentation> {
  const ephemeral = generateKeypair();
  const zk = await provePredicates({
    age: BigInt(opts.bundle.secrets.age.value),
    ageSalt: saltToField(opts.bundle.secrets.age.salt),
    gpa: BigInt(opts.bundle.secrets.gpaTenths.value),
    gpaSalt: saltToField(opts.bundle.secrets.gpaTenths.salt),
    ageHash: BigInt(opts.bundle.credential.commitments.age),
    gpaHash: BigInt(opts.bundle.credential.commitments.gpa),
    ageThreshold: BigInt(opts.request.ageGte),
    gpaThreshold: BigInt(opts.request.gpaGte),
  });

  const disclosures: Presentation["disclosures"] = {};
  for (const key of opts.disclose) {
    disclosures[key] = opts.bundle.secrets[key];
  }

  const expiresAt = Date.now() + PRESENTATION_TTL_MS;
  const holderBody = {
    sessionId: opts.sessionId,
    ephemeralDid: ephemeral.did,
    expiresAt,
    publicSignals: zk.publicSignals,
    disclosures,
  };

  return {
    sessionId: opts.sessionId,
    ephemeralDid: ephemeral.did,
    ephemeralPublicKey: ephemeral.publicKey,
    expiresAt,
    credential: opts.bundle.credential,
    disclosures,
    zk,
    holderSignature: signPayload(holderBody, ephemeral.secretKey),
  };
}
