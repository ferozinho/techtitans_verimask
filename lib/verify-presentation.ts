import { fieldCommitment, verifyPayload } from "./crypto";
import { labelsFromSchema } from "./credential";
import type { Presentation, SessionRequest } from "./types";

export type VerifyFailure = {
  ok: false;
  reason: string;
};

export type VerifySuccess = {
  ok: true;
  ephemeralDid: string;
  disclosed: Record<string, string>;
  hidden: string[];
  labels: Record<string, string>;
};

export function verifyPresentation(
  presentation: Presentation,
  request: SessionRequest,
): VerifySuccess | VerifyFailure {
  if (Date.now() > presentation.expiresAt) {
    return { ok: false, reason: "presentation_expired" };
  }

  const cred = presentation.credential;
  const { signature, ...unsigned } = cred;
  if (!verifyPayload(unsigned, signature, cred.issuerPublicKey)) {
    return { ok: false, reason: "issuer_signature_invalid" };
  }

  const holderBody = {
    sessionId: presentation.sessionId,
    ephemeralDid: presentation.ephemeralDid,
    expiresAt: presentation.expiresAt,
    disclosures: presentation.disclosures,
    credentialId: cred.id,
  };
  if (
    !verifyPayload(
      holderBody,
      presentation.holderSignature,
      presentation.ephemeralPublicKey,
    )
  ) {
    return { ok: false, reason: "holder_signature_invalid" };
  }

  const known = new Set(cred.schema.map((c) => c.id));
  const disclosed: Record<string, string> = {};
  const presented = Object.keys(presentation.disclosures);

  for (const key of request.disclose) {
    if (!presentation.disclosures[key]) {
      return { ok: false, reason: `missing_disclosure_${key}` };
    }
  }

  for (const key of presented) {
    if (!known.has(key) || !cred.commitments[key]) {
      return { ok: false, reason: "unknown_attribute" };
    }
    const field = presentation.disclosures[key];
    if (fieldCommitment(field.value, field.salt) !== cred.commitments[key]) {
      return { ok: false, reason: `disclosure_mismatch_${key}` };
    }
    disclosed[key] = field.value;
  }

  const hidden = cred.schema.map((c) => c.id).filter((id) => !presented.includes(id));

  return {
    ok: true,
    ephemeralDid: presentation.ephemeralDid,
    disclosed,
    hidden,
    labels: labelsFromSchema(cred.schema),
  };
}
