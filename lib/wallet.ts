import { STORAGE } from "./constants";
import type { HolderBundle, IssuerProfile, Keypair } from "./types";
import { generateKeypair } from "./crypto";

export function loadIssuer(): IssuerProfile | null {
  const raw = localStorage.getItem(STORAGE.issuer);
  return raw ? (JSON.parse(raw) as IssuerProfile) : null;
}

export function saveIssuer(profile: IssuerProfile) {
  localStorage.setItem(STORAGE.issuer, JSON.stringify(profile));
}

export function loadHolder(): HolderBundle | null {
  const raw = localStorage.getItem(STORAGE.holder);
  return raw ? (JSON.parse(raw) as HolderBundle) : null;
}

export function saveHolder(bundle: HolderBundle) {
  localStorage.setItem(STORAGE.holder, JSON.stringify(bundle));
}

export function clearHolder() {
  localStorage.removeItem(STORAGE.holder);
}

export function loadKiosk(): Keypair {
  const raw = localStorage.getItem(STORAGE.kiosk);
  if (raw) return JSON.parse(raw) as Keypair;
  const keys = generateKeypair();
  localStorage.setItem(STORAGE.kiosk, JSON.stringify(keys));
  return keys;
}
