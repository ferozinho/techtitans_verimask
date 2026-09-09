import { createWalletClient, http, isHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, foundry } from "viem/chains";
import type { Chain } from "viem";
import { registryAbi } from "./registry-abi";
import { claimsHash, didHash } from "./receipt";
import type { ChainAnchor } from "./types";

function chainFromId(id: number): Chain {
  if (id === 31337) return foundry;
  if (id === 11155111) return sepolia;
  return {
    ...sepolia,
    id,
    name: `chain-${id}`,
    rpcUrls: { default: { http: [process.env.VERIMASK_RPC_URL || ""] } },
  };
}

export function chainConfig() {
  const rpc = process.env.VERIMASK_RPC_URL;
  const key = process.env.VERIMASK_PRIVATE_KEY;
  const contract = process.env.VERIMASK_CONTRACT as `0x${string}` | undefined;
  const chainId = Number(process.env.VERIMASK_CHAIN_ID || "11155111");
  const explorer = process.env.VERIMASK_EXPLORER || "https://sepolia.etherscan.io";
  const ready = Boolean(rpc && key && contract && isHex(key) && key.length === 66);
  return { rpc, key, contract, chainId, explorer, ready };
}

export function chainStatus() {
  const cfg = chainConfig();
  return {
    ready: cfg.ready,
    chainId: cfg.chainId,
    contract: cfg.contract ?? null,
    explorer: cfg.explorer,
  };
}

async function client() {
  const cfg = chainConfig();
  if (!cfg.ready || !cfg.rpc || !cfg.key || !cfg.contract) return null;
  const account = privateKeyToAccount(cfg.key as `0x${string}`);
  return {
    wallet: createWalletClient({
      account,
      chain: chainFromId(cfg.chainId),
      transport: http(cfg.rpc),
    }),
    contract: cfg.contract,
    explorer: cfg.explorer,
  };
}

export async function registerAndAnchor(input: {
  did: string;
  pubkeyHex: string;
  credHash: string;
}): Promise<ChainAnchor> {
  const receiptHash = input.credHash.startsWith("0x")
    ? (input.credHash as `0x${string}`)
    : (`0x${input.credHash}` as `0x${string}`);
  const ctx = await client();
  if (!ctx) {
    return {
      status: "local",
      receiptHash,
      detail: "No operator key — hash kept, not broadcast.",
    };
  }
  try {
    const pubkey = (
      input.pubkeyHex.startsWith("0x") ? input.pubkeyHex : `0x${input.pubkeyHex}`
    ) as `0x${string}`;
    await ctx.wallet.writeContract({
      address: ctx.contract,
      abi: registryAbi,
      functionName: "registerIssuer",
      args: [input.did, pubkey],
    });
    const txHash = await ctx.wallet.writeContract({
      address: ctx.contract,
      abi: registryAbi,
      functionName: "anchorCredential",
      args: [receiptHash, didHash(input.did)],
    });
    return {
      status: "broadcast",
      receiptHash,
      txHash,
      explorerUrl: `${ctx.explorer}/tx/${txHash}`,
    };
  } catch (err) {
    return {
      status: "local",
      receiptHash,
      detail: err instanceof Error ? err.message : "broadcast failed",
    };
  }
}

export async function logVerification(input: {
  receiptHash: `0x${string}`;
  verifierDid: string;
  issuerDid: string;
  claimTypes: string[];
  passed: boolean;
}): Promise<ChainAnchor> {
  const ctx = await client();
  if (!ctx) {
    return {
      status: "local",
      receiptHash: input.receiptHash,
      detail: "No operator key — privacy receipt stored off-chain.",
    };
  }
  try {
    const txHash = await ctx.wallet.writeContract({
      address: ctx.contract,
      abi: registryAbi,
      functionName: "logVerification",
      args: [
        input.receiptHash,
        didHash(input.verifierDid),
        didHash(input.issuerDid),
        claimsHash(input.claimTypes),
        input.passed,
      ],
    });
    return {
      status: "broadcast",
      receiptHash: input.receiptHash,
      txHash,
      explorerUrl: `${ctx.explorer}/tx/${txHash}`,
    };
  } catch (err) {
    return {
      status: "local",
      receiptHash: input.receiptHash,
      detail: err instanceof Error ? err.message : "broadcast failed",
    };
  }
}
