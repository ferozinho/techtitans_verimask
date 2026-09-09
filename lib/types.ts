export type FieldKey = "name" | "degree" | "program";

export type CommitmentMap = {
  name: string;
  age: string;
  gpa: string;
  degree: string;
  program: string;
};

export type SignedCredential = {
  id: string;
  type: "StudentCredential";
  issuerDid: string;
  issuerPublicKey: string;
  issuedAt: string;
  college: string;
  commitments: CommitmentMap;
  signature: string;
};

export type FieldSecret = {
  value: string;
  salt: string;
};

export type NumericSecret = {
  value: number;
  salt: string;
};

export type HolderSecrets = {
  name: FieldSecret;
  degree: FieldSecret;
  program: FieldSecret;
  dob: string;
  age: NumericSecret;
  gpaTenths: NumericSecret;
};

export type HolderBundle = {
  credential: SignedCredential;
  secrets: HolderSecrets;
};

export type SessionRequest = {
  ageGte: number;
  gpaGte: number;
  disclose: FieldKey[];
  verifierDid: string;
};

export type SessionStatus = "pending" | "pass" | "fail" | "expired";

export type SessionResult = {
  ephemeralDid: string;
  disclosed: Partial<Record<FieldKey, string>>;
  predicates: {
    ageGte: boolean;
    gpaGte: boolean;
  };
  verifiedAt: number;
  reason?: string;
};

export type VerifySession = {
  id: string;
  createdAt: number;
  expiresAt: number;
  request: SessionRequest;
  status: SessionStatus;
  result?: SessionResult;
};

export type Groth16Proof = {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
};

export type Presentation = {
  sessionId: string;
  ephemeralDid: string;
  ephemeralPublicKey: string;
  expiresAt: number;
  credential: SignedCredential;
  disclosures: Partial<Record<FieldKey, FieldSecret>>;
  zk: {
    proof: Groth16Proof;
    publicSignals: string[];
  };
  holderSignature: string;
};

export type IssuerProfile = {
  did: string;
  publicKey: string;
  secretKey: string;
  college: string;
};

export type Keypair = {
  did: string;
  publicKey: string;
  secretKey: string;
};
