"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PolicyCard } from "@/components/Policy";
import { Button, Field, inputClass, Shell } from "@/components/ui";
import { labelsFromSchema } from "@/lib/credential";
import { buildPresentation } from "@/lib/present";
import { packById } from "@/lib/schema";
import type { HolderBundle, VerifySession } from "@/lib/types";
import { clearHolder, loadHolder, saveHolder } from "@/lib/wallet";

export default function HolderPage() {
  return (
    <Shell role="holder · wallet">
      <Suspense fallback={<p className="font-mono text-mist">loading wallet…</p>}>
        <HolderInner />
      </Suspense>
    </Shell>
  );
}

function HolderInner() {
  const search = useSearchParams();
  const sessionId = search.get("s");
  const [bundle, setBundle] = useState<HolderBundle | null>(null);
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState("");
  const [session, setSession] = useState<VerifySession | null>(null);
  const [disclose, setDisclose] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBundle(loadHolder());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((s) => {
        if (s.id) {
          setSession(s);
          setDisclose(s.request.disclose);
        }
      })
      .catch(() => setError("could not load kiosk session"));
  }, [sessionId]);

  const labels = useMemo(
    () => (bundle ? labelsFromSchema(bundle.credential.schema) : {}),
    [bundle],
  );
  const schemaIds = bundle?.credential.schema.map((c) => c.id) ?? [];
  const missingRequired =
    session && bundle
      ? session.request.disclose.filter((id) => !bundle.secrets[id])
      : [];
  const pack = session ? packById(session.request.packId) : null;

  async function claim() {
    setError(null);
    const res = await fetch(`/api/pickup/${code.trim()}`);
    const data = await res.json();
    if (!res.ok) {
      setError("code expired or unknown");
      return;
    }
    saveHolder(data);
    setBundle(data);
  }

  function onImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as HolderBundle;
        saveHolder(parsed);
        setBundle(parsed);
      } catch {
        setError("bad bundle file");
      }
    };
    reader.readAsText(file);
  }

  function toggle(key: string) {
    const required = session?.request.disclose ?? [];
    if (required.includes(key)) return;
    setDisclose((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
    );
  }

  async function present() {
    if (!bundle || !session) return;
    if (missingRequired.length) {
      setError(
        `this wallet is missing ${missingRequired.join(", ")} — pick another policy or issue those claims`,
      );
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const presentation = buildPresentation({
        bundle,
        sessionId: session.id,
        disclose,
      });
      const res = await fetch(`/api/sessions/${session.id}/present`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(presentation),
      });
      const data = await res.json();
      setStatus(
        data.status === "pass"
          ? "portal should flip green"
          : `portal: ${data.status}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "present failed");
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    if (!session) return;
    await fetch(`/api/sessions/${session.id}/present`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fail: true, reason: "holder_declined" }),
    });
    setStatus("declined — portal will show fail");
  }

  if (!ready) {
    return <p className="font-mono text-mist">loading wallet…</p>;
  }

  const issuerLine = bundle?.credential.issuerName;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-acid">
          wallet
        </p>
        <h1 className="mt-3 text-5xl font-semibold">Your claims.</h1>
        <p className="mt-4 max-w-lg text-paper-dim">
          Scan the portal QR. Tick only extra fields you want to add. Required
          claims stay on. Everything else stays in this wallet.
        </p>

        {!bundle && (
          <div className="mt-10 grid gap-4">
            <Field label="pickup code">
              <div className="flex gap-3">
                <input
                  className={`${inputClass()} uppercase tracking-[0.2em]`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="XK7M2P"
                />
                <Button type="button" onClick={claim}>
                  Claim
                </Button>
              </div>
            </Field>
            <Field label="or import json">
              <input
                type="file"
                accept="application/json"
                className="font-mono text-xs text-mist"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImport(file);
                }}
              />
            </Field>
          </div>
        )}

        {bundle && (
          <div className="mt-10 border border-paper/15 bg-ink-2 p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
              {issuerLine}
            </div>
            <p className="mt-3 text-3xl">
              {bundle.secrets.name?.value ?? bundle.credential.id}
            </p>
            <dl className="mt-8 space-y-3 font-mono text-sm">
              {bundle.credential.schema.map((claim) => {
                const on = disclose.includes(claim.id);
                return (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between gap-4"
                  >
                    <div>
                      <dt className="text-mist">{claim.label}</dt>
                      <dd className="mt-1 text-paper">
                        {bundle.secrets[claim.id]?.value}
                      </dd>
                    </div>
                    <span className={on ? "text-acid" : "text-mist"}>
                      {on ? "disclose" : "hidden"}
                    </span>
                  </div>
                );
              })}
            </dl>
            <Button
              type="button"
              tone="ghost"
              className="mt-6"
              onClick={() => {
                clearHolder();
                setBundle(null);
              }}
            >
              Drop wallet
            </Button>
          </div>
        )}
      </div>

      <aside className="space-y-6">
        {session ? (
          <PolicyCard
            required={session.request.disclose}
            extra={disclose.filter((k) => !session.request.disclose.includes(k))}
            labels={labels}
            schemaIds={schemaIds}
          />
        ) : (
          <p className="border border-paper/15 p-6 text-paper-dim">
            No live session. Open this page from the portal QR.
          </p>
        )}
        {session && pack && (
          <p className="font-mono text-xs text-mist">
            Policy pack: {pack.label}. {pack.blurb}
          </p>
        )}
        {session && (
          <div className="border border-paper/15 p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
              extra disclosure
            </div>
            <div className="mt-5 space-y-3">
              {schemaIds.map((key) => {
                const required = session.request.disclose.includes(key);
                const on = disclose.includes(key);
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="font-mono text-sm uppercase tracking-[0.12em]">
                      {labels[key] ?? key}
                      {required ? " · required" : ""}
                    </span>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={required}
                      onChange={() => toggle(key)}
                    />
                  </label>
                );
              })}
            </div>
            {missingRequired.length > 0 && (
              <p className="mt-4 text-sm text-signal">
                This wallet does not have {missingRequired.join(", ")}. Issue a
                matching template or pick another pack at the portal.
              </p>
            )}
            <Button
              type="button"
              className="mt-8 w-full"
              disabled={!bundle || busy || missingRequired.length > 0}
              onClick={present}
            >
              {busy ? "Presenting…" : "Present selected claims"}
            </Button>
            <Button
              type="button"
              tone="ghost"
              className="mt-3 w-full"
              disabled={!session}
              onClick={decline}
            >
              Decline
            </Button>
            {status && <p className="mt-4 text-acid">{status}</p>}
          </div>
        )}
        {error && <p className="text-signal">{error}</p>}
      </aside>
    </div>
  );
}
