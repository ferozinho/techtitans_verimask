import { labelFor } from "@/lib/schema";
import type { ChainAnchor } from "@/lib/types";

export function PolicyCard({
  required,
  extra,
  labels,
  schemaIds,
}: {
  required: string[];
  extra?: string[];
  labels?: Record<string, string>;
  schemaIds?: string[];
}) {
  const hidden = schemaIds?.filter((k) => !required.includes(k)) ?? [];
  return (
    <div className="border border-acid/40 bg-ink-2 p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-acid">
        disclosure policy
      </div>
      <p className="mt-3 text-2xl font-semibold">
        Need {required.length} claims. Hide the rest.
      </p>
      <p className="mt-2 text-paper-dim">
        Verifier learns the subset. Everything else stays in the wallet.
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            required
          </div>
          <ul className="mt-3 space-y-1 text-acid">
            {required.map((k) => (
              <li key={k}>{labelFor(k, labels)}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            stays hidden
          </div>
          {hidden.length ? (
            <ul className="mt-3 space-y-1 text-paper-dim">
              {hidden.map((k) => (
                <li key={k}>
                  {labelFor(k, labels)}
                  {extra?.includes(k) ? " · adding this scan" : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-paper-dim">
              Every other claim in the wallet.
              {extra?.length
                ? ` Adding ${extra.map((k) => labelFor(k, labels)).join(", ")} this scan.`
                : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChainNote({ chain }: { chain?: ChainAnchor }) {
  if (!chain) return null;
  return (
    <div className="mt-8 border border-paper/15 p-4 text-left">
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
        on-chain receipt · claim types only · no pii
      </div>
      <p className="mt-2 break-all font-mono text-xs text-acid">
        {chain.receiptHash}
      </p>
      {chain.txHash && (
        <a
          className="mt-2 inline-block font-mono text-xs text-paper hover:text-acid"
          href={chain.explorerUrl}
          target="_blank"
          rel="noreferrer"
        >
          tx {chain.txHash.slice(0, 10)}…{chain.txHash.slice(-6)}
        </a>
      )}
      <p className="mt-2 font-mono text-[11px] text-mist">
        {chain.status === "broadcast"
          ? "broadcast to registry"
          : chain.detail || "local keccak receipt — set operator key to broadcast"}
      </p>
    </div>
  );
}
