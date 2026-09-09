"use client";

import { useEffect, useMemo, useState } from "react";
import { ChainNote } from "@/components/Policy";
import { Button, Field, inputClass, Shell } from "@/components/ui";
import { issueCredential } from "@/lib/credential";
import { generateKeypair, shortDid } from "@/lib/crypto";
import { credentialAnchorHash } from "@/lib/receipt";
import { TEMPLATES, templateById, uniqueClaimId } from "@/lib/schema";
import type { ChainAnchor, HolderBundle, IssuerProfile } from "@/lib/types";
import { loadIssuer, saveHolder, saveIssuer } from "@/lib/wallet";

type ExtraClaim = { label: string; value: string };

function emptyValues(templateId: string): Record<string, string> {
  return Object.fromEntries(
    templateById(templateId).claims.map((c) => [c.id, ""]),
  );
}

function sampleValues(templateId: string): Record<string, string> {
  return Object.fromEntries(
    templateById(templateId).claims.map((c) => [c.id, c.sample]),
  );
}

export default function IssuerPage() {
  const [issuer, setIssuer] = useState<IssuerProfile | null>(null);
  const [issuerName, setIssuerName] = useState("Verimask Demo Issuer");
  const [templateId, setTemplateId] = useState("employer");
  const [values, setValues] = useState<Record<string, string>>(() =>
    emptyValues("employer"),
  );
  const [extras, setExtras] = useState<ExtraClaim[]>([]);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<HolderBundle | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [chain, setChain] = useState<ChainAnchor | null>(null);
  const [error, setError] = useState<string | null>(null);

  const template = useMemo(() => templateById(templateId), [templateId]);

  useEffect(() => {
    const existing = loadIssuer();
    if (existing) {
      setIssuer(existing);
      setIssuerName(existing.issuerName);
    }
  }, []);

  function pickTemplate(id: string) {
    setTemplateId(id);
    setValues(emptyValues(id));
    setExtras([]);
  }

  function ensureIssuer(): IssuerProfile {
    const name = issuerName.trim() || "Verimask Demo Issuer";
    if (issuer) {
      const next = { ...issuer, issuerName: name };
      saveIssuer(next);
      setIssuer(next);
      return next;
    }
    const created: IssuerProfile = { ...generateKeypair(), issuerName: name };
    saveIssuer(created);
    setIssuer(created);
    return created;
  }

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const profile = ensureIssuer();
      const used = new Set(template.claims.map((c) => c.id));
      const claims = [
        ...template.claims.map((c) => ({
          id: c.id,
          label: c.label,
          value: values[c.id] ?? "",
        })),
        ...extras
          .filter((x) => x.label.trim() && x.value.trim())
          .map((x) => ({
            id: uniqueClaimId(x.label, used),
            label: x.label.trim(),
            value: x.value.trim(),
          })),
      ];
      const bundle = issueCredential({
        issuer: profile,
        templateId,
        claims,
      });
      saveHolder(bundle);
      setIssued(bundle);
      const pickup = await fetch("/api/pickup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(bundle),
      });
      const data = await pickup.json();
      if (pickup.ok) setCode(data.code);
      const anchored = await fetch("/api/chain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          did: profile.did,
          pubkeyHex: profile.publicKey,
          credHash: credentialAnchorHash(bundle.credential.commitments),
        }),
      });
      setChain(await anchored.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "issue failed");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!issued) return;
    const blob = new Blob([JSON.stringify(issued, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${issued.credential.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewName = issued?.secrets.name?.value;
  const previewBits = issued
    ? issued.credential.schema
        .filter((c) => c.id !== "name")
        .slice(0, 2)
        .map((c) => issued.secrets[c.id]?.value)
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <Shell role="issuer">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-acid">
            issuance
          </p>
          <h1 className="mt-3 text-5xl font-semibold">Stamp a bundle of claims.</h1>
          <p className="mt-4 max-w-lg text-paper-dim">
            Issued at onboarding, long before a tip. A hotline can ask for
            institution + employed. Name and staff ID stay in the wallet. Same
            stamp still works at a gate or a hiring desk.
          </p>

          <form onSubmit={onIssue} className="mt-10 grid gap-5">
            <Field label="issuer name">
              <input
                className={inputClass()}
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                required
              />
            </Field>
            <div>
              <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
                template
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickTemplate(t.id)}
                    className={`border px-4 py-3 text-left ${
                      templateId === t.id
                        ? "border-acid text-acid"
                        : "border-paper/20 text-paper hover:border-paper/50"
                    }`}
                  >
                    <div className="font-semibold">{t.label}</div>
                    <div className="mt-1 font-mono text-[11px] text-mist">
                      {t.blurb}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {template.claims.map((claim) => (
              <Field key={claim.id} label={claim.label}>
                <input
                  className={inputClass()}
                  type={claim.id === "dateOfBirth" ? "date" : "text"}
                  value={values[claim.id] ?? ""}
                  onChange={(e) =>
                    setValues((cur) => ({ ...cur, [claim.id]: e.target.value }))
                  }
                  required
                />
              </Field>
            ))}
            {values.dateOfBirth && (
              <p className="font-mono text-xs text-mist">
                DOB also stamps a hidden Age 18+ claim (yes/no). Birthday never
                has to leave the wallet.
              </p>
            )}
            {extras.map((extra, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Field label="extra claim">
                  <input
                    className={inputClass()}
                    placeholder="label"
                    value={extra.label}
                    onChange={(e) =>
                      setExtras((cur) =>
                        cur.map((x, j) =>
                          j === i ? { ...x, label: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="value">
                  <input
                    className={inputClass()}
                    value={extra.value}
                    onChange={(e) =>
                      setExtras((cur) =>
                        cur.map((x, j) =>
                          j === i ? { ...x, value: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </Field>
                <Button
                  type="button"
                  tone="ghost"
                  className="self-end"
                  onClick={() => setExtras((cur) => cur.filter((_, j) => j !== i))}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? "Signing…" : "Issue credential"}
              </Button>
              <Button
                type="button"
                tone="ghost"
                onClick={() => {
                  setValues(sampleValues(templateId));
                  setExtras([]);
                }}
              >
                Fill sample
              </Button>
              <Button
                type="button"
                tone="ghost"
                onClick={() => setExtras((cur) => [...cur, { label: "", value: "" }])}
              >
                Add claim
              </Button>
            </div>
            {error && <p className="text-signal">{error}</p>}
          </form>
        </div>

        <aside className="border border-paper/15 bg-ink-2 p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
            issuer did
          </div>
          <p className="mt-3 break-all font-mono text-sm text-acid">
            {issuer ? shortDid(issuer.did) : "created on first stamp"}
          </p>
          {issued && (
            <div className="mt-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
                last issuance · {issued.credential.schema.length} claims
              </div>
              <p className="mt-3 text-2xl">{previewName ?? issued.credential.id}</p>
              {previewBits && (
                <p className="mt-1 text-paper-dim">{previewBits}</p>
              )}
              <p className="mt-6 font-mono text-xs text-mist">
                Saved to this browser’s holder wallet. Each claim committed
                separately. Zero plaintext on the registry.
              </p>
              {issued.secrets.over18 && (
                <p className="mt-3 font-mono text-xs text-acid">
                  Age 18+ stamped as {issued.secrets.over18.value} from DOB.
                </p>
              )}
              {code && (
                <div className="stamp mt-6 bg-acid px-5 py-4 text-ink">
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em]">
                    pickup code
                  </div>
                  <div className="mt-2 font-mono text-4xl tracking-[0.2em]">
                    {code}
                  </div>
                  <p className="mt-2 text-sm">
                    Phone wallet: enter on /holder. Dies in 15 min.
                  </p>
                </div>
              )}
              <ChainNote chain={chain ?? undefined} />
              <Button type="button" tone="ghost" className="mt-6" onClick={download}>
                Download bundle
              </Button>
            </div>
          )}
        </aside>
      </div>
    </Shell>
  );
}
