export const registryAbi = [
  {
    type: "function",
    name: "registerIssuer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "did", type: "string" },
      { name: "pubkey", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "anchorCredential",
    stateMutability: "nonpayable",
    inputs: [
      { name: "credHash", type: "bytes32" },
      { name: "issuerDidHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "logVerification",
    stateMutability: "nonpayable",
    inputs: [
      { name: "receipt", type: "bytes32" },
      { name: "verifierDidHash", type: "bytes32" },
      { name: "issuerDidHash", type: "bytes32" },
      { name: "claimsHash", type: "bytes32" },
      { name: "passed", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "IssuerRegistered",
    inputs: [
      { name: "didHash", type: "bytes32", indexed: true },
      { name: "did", type: "string", indexed: false },
      { name: "pubkey", type: "bytes", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CredentialAnchored",
    inputs: [
      { name: "credHash", type: "bytes32", indexed: true },
      { name: "issuerDidHash", type: "bytes32", indexed: true },
    ],
  },
  {
    type: "event",
    name: "VerificationLogged",
    inputs: [
      { name: "receipt", type: "bytes32", indexed: true },
      { name: "verifierDidHash", type: "bytes32", indexed: true },
      { name: "issuerDidHash", type: "bytes32", indexed: true },
      { name: "claimsHash", type: "bytes32", indexed: false },
      { name: "passed", type: "bool", indexed: false },
      { name: "at", type: "uint64", indexed: false },
    ],
  },
] as const;
