import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes, randomBytes, utf8ToBytes } from "@noble/hashes/utils";
import { canonical } from "./canonical";
import type { Keypair } from "./types";

export function randomHex(bytes = 32): string {
  return bytesToHex(randomBytes(bytes));
}

export function didFromPublicKey(publicKeyHex: string): string {
  return `did:verimask:${publicKeyHex}`;
}

export function generateKeypair(): Keypair {
  const secret = ed25519.utils.randomPrivateKey();
  const publicKey = bytesToHex(ed25519.getPublicKey(secret));
  const secretKey = bytesToHex(secret);
  return { did: didFromPublicKey(publicKey), publicKey, secretKey };
}

export function signPayload(payload: unknown, secretKeyHex: string): string {
  const digest = sha256(utf8ToBytes(canonical(payload)));
  return bytesToHex(ed25519.sign(digest, hexToBytes(secretKeyHex)));
}

export function verifyPayload(
  payload: unknown,
  signatureHex: string,
  publicKeyHex: string,
): boolean {
  const digest = sha256(utf8ToBytes(canonical(payload)));
  try {
    return ed25519.verify(hexToBytes(signatureHex), digest, hexToBytes(publicKeyHex));
  } catch {
    return false;
  }
}

export function fieldCommitment(value: string, salt: string): string {
  return bytesToHex(sha256(utf8ToBytes(`${value}:${salt}`)));
}

export function ageFromDob(iso: string, now = new Date()): number {
  const born = new Date(iso);
  let age = now.getFullYear() - born.getFullYear();
  const month = now.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

export function gpaToTenths(gpa: number): number {
  return Math.round(gpa * 10);
}

export function tenthsToGpa(tenths: number): string {
  return (tenths / 10).toFixed(1);
}

export function saltToField(saltHex: string): bigint {
  return BigInt(`0x${saltHex}`) % (BigInt(1) << BigInt(248));
}

export function shortDid(did: string): string {
  if (did.length < 22) return did;
  return `${did.slice(0, 18)}…${did.slice(-6)}`;
}

export function randomCode(length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
