import { PRESENTATION_TTL_MS } from "./constants";
import { generateKeypair, signPayload } from "./crypto";
import type { HolderBundle, Presentation } from "./types";

export function buildPresentation(opts: {
  bundle: HolderBundle;
  sessionId: string;
  disclose: string[];
}): Presentation {
  const ephemeral = generateKeypair();
  const disclosures: Presentation["disclosures"] = {};
  for (const key of opts.disclose) {
    const secret = opts.bundle.secrets[key];
    if (secret) disclosures[key] = secret;
  }

  const expiresAt = Date.now() + PRESENTATION_TTL_MS;
  const holderBody = {
    sessionId: opts.sessionId,
    ephemeralDid: ephemeral.did,
    expiresAt,
    disclosures,
    credentialId: opts.bundle.credential.id,
  };

  return {
    sessionId: opts.sessionId,
    ephemeralDid: ephemeral.did,
    ephemeralPublicKey: ephemeral.publicKey,
    expiresAt,
    credential: opts.bundle.credential,
    disclosures,
    holderSignature: signPayload(holderBody, ephemeral.secretKey),
  };
}
