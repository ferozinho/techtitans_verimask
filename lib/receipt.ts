import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import { canonical } from "./canonical";

export function keccakHex(value: string): `0x${string}` {
  return `0x${bytesToHex(keccak_256(utf8ToBytes(value)))}`;
}

export function verificationReceipt(input: {
  sessionId: string;
  verifierDid: string;
  issuerDid: string;
  claimTypes: string[];
  passed: boolean;
}): `0x${string}` {
  return keccakHex(
    canonical({
      sessionId: input.sessionId,
      verifierDid: input.verifierDid,
      issuerDid: input.issuerDid,
      claimTypes: [...input.claimTypes].sort(),
      passed: input.passed,
    }),
  );
}

export function didHash(did: string): `0x${string}` {
  return keccakHex(did);
}

export function credentialAnchorHash(commitments: unknown): `0x${string}` {
  return keccakHex(canonical(commitments));
}

export function claimsHash(claimTypes: string[]): `0x${string}` {
  return keccakHex(canonical([...claimTypes].sort()));
}
