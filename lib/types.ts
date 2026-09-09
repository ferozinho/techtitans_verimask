export type ClaimMeta = {
  id: string;
  label: string;
};

export type FieldSecret = {
  value: string;
  salt: string;
};

export type SignedCredential = {
  id: string;
  type: "IdentityCredential";
  issuerDid: string;
  issuerPublicKey: string;
  issuedAt: string;
  issuerName: string;
  templateId: string;
  schema: ClaimMeta[];
  commitments: Record<string, string>;
  signature: string;
};

export type HolderSecrets = Record<string, FieldSecret>;

export type HolderBundle = {
  credential: SignedCredential;
  secrets: HolderSecrets;
};

export type SessionRequest = {
  packId: string;
  disclose: string[];
  verifierDid: string;
};

export type SessionStatus = "pending" | "pass" | "fail" | "expired";

export type ChainAnchor = {
  status: "broadcast" | "local";
  receiptHash: string;
  txHash?: string;
  explorerUrl?: string;
  detail?: string;
};

export type SessionResult = {
  ephemeralDid: string;
  disclosed: Record<string, string>;
  hiddenKeys: string[];
  labels: Record<string, string>;
  verifiedAt: number;
  reason?: string;
  chain?: ChainAnchor;
};

export type VerifySession = {
  id: string;
  createdAt: number;
  expiresAt: number;
  request: SessionRequest;
  status: SessionStatus;
  result?: SessionResult;
};

export type Presentation = {
  sessionId: string;
  ephemeralDid: string;
  ephemeralPublicKey: string;
  expiresAt: number;
  credential: SignedCredential;
  disclosures: Record<string, FieldSecret>;
  holderSignature: string;
};

export type IssuerProfile = {
  did: string;
  publicKey: string;
  secretKey: string;
  issuerName: string;
};

export type Keypair = {
  did: string;
  publicKey: string;
  secretKey: string;
};

export type Groth16Proof = {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
};
