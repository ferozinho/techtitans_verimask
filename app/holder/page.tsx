"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Field, inputClass, Shell } from "@/components/ui";
import { AGE_THRESHOLD, GPA_TENTHS_THRESHOLD } from "@/lib/constants";
import { meetsPredicates } from "@/lib/credential";
import { tenthsToGpa } from "@/lib/crypto";
import { buildPresentation } from "@/lib/present";
import type { FieldKey, HolderBundle, VerifySession } from "@/lib/types";
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
  const [code, setCode] = useState("");
  const [session, setSession] = useState<VerifySession | null>(null);
  const [disclose, setDisclose] = useState<FieldKey[]>(["degree"]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBundle(loadHolder());
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

  const predicates = useMemo(
    () => (bundle ? meetsPredicates(bundle) : null),
    [bundle],
  );

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

  function toggle(key: FieldKey) {
    const required = session?.request.disclose ?? [];
    if (required.includes(key)) return;
    setDisclose((cur) =>
      cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
    );
  }

  async function present() {
    if (!bundle || !session) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      if (!predicates?.age || !predicates.gpa) {
        await fetch(`/api/sessions/${session.id}/present`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fail: true, reason: "predicates_unsatisfied" }),
        });
        setStatus("sent fail — you don’t meet the range");
        return;
      }
      setStatus("weaving groth16 proof…");
      const presentation = await buildPresentation({
        bundle,
        sessionId: session.id,
        request: session.request,
        disclose,
      });
      const res = await fetch(`/api/sessions/${session.id}/present`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(presentation),
      });
      const data = await res.json();
      setStatus(data.status === "pass" ? "kiosk should flip green" : `kiosk: ${data.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "prove failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-acid">
          wallet
        </p>
        <h1 className="mt-3 text-5xl font-semibold">Your mask.</h1>
        <p className="mt-4 max-w-lg text-paper-dim">
          Scan the kiosk QR with your phone camera. This page will ask for
          predicates, not your GPA.
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
              {bundle.credential.college}
            </div>
            <p className="mt-3 text-3xl">{bundle.secrets.name.value}</p>
            <p className="mt-2 text-paper-dim">
              {bundle.secrets.degree.value} · {bundle.secrets.program.value}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-4 font-mono text-sm">
              <div>
                <dt className="text-mist">age (hidden)</dt>
                <dd className="mt-1 text-acid">{bundle.secrets.age.value}</dd>
              </div>
              <div>
                <dt className="text-mist">gpa (hidden)</dt>
                <dd className="mt-1 text-acid">
                  {tenthsToGpa(bundle.secrets.gpaTenths.value)}
                </dd>
              </div>
            </dl>
            <p className="mt-6 font-mono text-[11px] text-mist">
              {bundle.credential.id}
            </p>
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

      <aside className="border border-paper/15 p-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
          kiosk request
        </div>
        {!session && (
          <p className="mt-4 text-paper-dim">
            No live session. Open this page from the kiosk QR, or wait for a
            scan.
          </p>
        )}
        {session && (
          <>
            <h2 className="mt-4 text-3xl">Prove without showing.</h2>
            <ul className="mt-6 space-y-2 font-mono text-sm text-acid">
              <li>age ≥ {session.request.ageGte ?? AGE_THRESHOLD}</li>
              <li>
                gpa ≥ {tenthsToGpa(session.request.gpaGte ?? GPA_TENTHS_THRESHOLD)}
              </li>
            </ul>
            <div className="mt-8 space-y-3">
              {(["name", "degree", "program"] as FieldKey[]).map((key) => {
                const required = session.request.disclose.includes(key);
                const on = disclose.includes(key);
                return (
                  <label key={key} className="flex items-center justify-between gap-4">
                    <span className="font-mono text-sm uppercase tracking-[0.14em]">
                      reveal {key}
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
            {predicates && (
              <p className="mt-6 font-mono text-xs text-mist">
                local check: age {predicates.age ? "ok" : "fail"} · gpa{" "}
                {predicates.gpa ? "ok" : "fail"}
              </p>
            )}
            <Button
              type="button"
              className="mt-8 w-full"
              disabled={!bundle || busy}
              onClick={present}
            >
              {busy ? "Proving…" : "Verify"}
            </Button>
            {status && <p className="mt-4 text-acid">{status}</p>}
          </>
        )}
        {error && <p className="mt-4 text-signal">{error}</p>}
      </aside>
    </div>
  );
}
