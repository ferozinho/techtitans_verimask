import { AGE_THRESHOLD, GPA_TENTHS_THRESHOLD } from "./constants";
import { fieldCommitment, verifyPayload } from "./crypto";
import type { Presentation, SessionRequest } from "./types";
import { verifyGroth16 } from "./zk-verify";

export type VerifyFailure = {
  ok: false;
  reason: string;
};

export type VerifySuccess = {
  ok: true;
  ephemeralDid: string;
  disclosed: Record<string, string>;
};

export async function verifyPresentation(
  presentation: Presentation,
  request: SessionRequest,
): Promise<VerifySuccess | VerifyFailure> {
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
    publicSignals: presentation.zk.publicSignals,
    disclosures: presentation.disclosures,
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

  const signals = presentation.zk.publicSignals;
  if (signals.length < 4) return { ok: false, reason: "malformed_proof" };
  if (signals[0] !== cred.commitments.age) {
    return { ok: false, reason: "age_commitment_mismatch" };
  }
  if (signals[1] !== cred.commitments.gpa) {
    return { ok: false, reason: "gpa_commitment_mismatch" };
  }
  if (signals[2] !== String(request.ageGte ?? AGE_THRESHOLD)) {
    return { ok: false, reason: "age_threshold_mismatch" };
  }
  if (signals[3] !== String(request.gpaGte ?? GPA_TENTHS_THRESHOLD)) {
    return { ok: false, reason: "gpa_threshold_mismatch" };
  }

  const zkOk = await verifyGroth16(presentation.zk.proof, signals);
  if (!zkOk) return { ok: false, reason: "zk_proof_invalid" };

  const disclosed: Record<string, string> = {};
  for (const key of request.disclose) {
    const field = presentation.disclosures[key];
    if (!field) return { ok: false, reason: `missing_disclosure_${key}` };
    const expected = cred.commitments[key];
    if (fieldCommitment(field.value, field.salt) !== expected) {
      return { ok: false, reason: `disclosure_mismatch_${key}` };
    }
    disclosed[key] = field.value;
  }

  return { ok: true, ephemeralDid: presentation.ephemeralDid, disclosed };
}
