"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Wordmark } from "@/components/Brand";
import { ChainNote, PolicyCard } from "@/components/Policy";
import { Button } from "@/components/ui";
import { labelFor, packById, POLICY_PACKS } from "@/lib/schema";
import type { VerifySession } from "@/lib/types";
import { loadKiosk } from "@/lib/wallet";

export default function KioskPage() {
  const [packId, setPackId] = useState("source");
  const [session, setSession] = useState<VerifySession | null>(null);
  const [origin, setOrigin] = useState("");
  const [durable, setDurable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mint = useCallback(async (nextPackId: string) => {
    setError(null);
    const pack = packById(nextPackId);
    const kiosk = loadKiosk();
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        verifierDid: kiosk.did,
        packId: pack.id,
        disclose: pack.required,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError("could not open a session");
      return;
    }
    setDurable(Boolean(data.durable));
    setSession(data.session);
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    mint("source");
  }, [mint]);

  useEffect(() => {
    if (!session?.id || session.status !== "pending") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/sessions/${session.id}`);
      if (!res.ok) return;
      const next = (await res.json()) as VerifySession;
      setSession(next);
    }, 900);
    return () => clearInterval(t);
  }, [session?.id, session?.status]);

  const holderUrl = session && origin ? `${origin}/holder?s=${session.id}` : "";
  const pack = packById(session?.request.packId ?? packId);

  function onPickPack(id: string) {
    setPackId(id);
    mint(id);
  }

  return (
    <div className="relative min-h-dvh px-6 py-6 md:px-10">
      <header className="flex items-center justify-between">
        <Wordmark />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist">
          verification portal
        </span>
      </header>

      {!session && !error && (
        <p className="mt-20 font-mono text-sm text-mist">Opening verification session…</p>
      )}

      {session?.status === "pending" && (
        <div className="mx-auto mt-10 grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-acid">
              source · gate · hiring · staff
            </p>
            <h1 className="mt-4 text-5xl font-semibold md:text-7xl">
              Scan to disclose.
            </h1>
            <label className="mt-8 block">
              <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
                policy pack
              </span>
              <select
                className="w-full border border-paper/20 bg-ink-2 px-3 py-3 font-mono text-sm text-paper outline-none focus:border-acid"
                value={pack.id}
                onChange={(e) => onPickPack(e.target.value)}
              >
                {POLICY_PACKS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 font-mono text-xs text-mist">{pack.blurb}</p>
            </label>
            <div className="mt-8">
              <PolicyCard required={session.request.disclose} />
            </div>
            <p className="mt-8 max-w-md font-mono text-xs text-mist">
              Session dies in 15 minutes. Pairwise DID. Phone camera opens the
              wallet. Same laptop: open the link under the QR. Switch packs to
              mint a new QR.
            </p>
            {!durable && (
              <p className="mt-4 text-sm text-signal">
                No Redis — fine on one machine. Add Upstash on Vercel for phone +
                laptop.
              </p>
            )}
            <Button type="button" tone="ghost" className="mt-8" onClick={() => mint(packId)}>
              New QR
            </Button>
          </div>
          <div className="scanline border border-paper/20 bg-paper p-6 text-ink">
            {holderUrl && (
              <QRCodeSVG
                value={holderUrl}
                size={280}
                bgColor="#eadfc8"
                fgColor="#090b08"
                className="mx-auto h-auto w-full max-w-[280px]"
              />
            )}
            <p className="mt-5 break-all font-mono text-[11px]">{holderUrl}</p>
          </div>
        </div>
      )}

      {session?.status === "pass" && (
        <Result tone="pass" title="PASS" session={session} onReset={() => mint(packId)} />
      )}
      {(session?.status === "fail" || session?.status === "expired") && (
        <Result
          tone="fail"
          title={session.status === "expired" ? "EXPIRED" : "FAIL"}
          session={session}
          onReset={() => mint(packId)}
        />
      )}
      {error && <p className="mt-8 text-signal">{error}</p>}
    </div>
  );
}

function Result({
  tone,
  title,
  session,
  onReset,
}: {
  tone: "pass" | "fail";
  title: string;
  session: VerifySession;
  onReset: () => void;
}) {
  const pass = tone === "pass";
  const disclosed = Object.entries(session.result?.disclosed ?? {});
  const hiddenCount = session.result?.hiddenKeys.length ?? 0;
  const total = disclosed.length + hiddenCount;
  const labels = session.result?.labels ?? {};

  return (
    <div className="mx-auto mt-12 max-w-3xl">
      <div
        className={`inline-block px-8 py-3 font-mono text-sm tracking-[0.3em] ${
          pass ? "bg-acid text-ink" : "bg-signal text-ink"
        }`}
      >
        {pass ? "policy satisfied" : session.result?.reason ?? "rejected"}
      </div>
      <h1
        className={`mt-6 text-8xl font-semibold md:text-[8rem] ${
          pass ? "text-acid" : "text-signal"
        }`}
      >
        {title}
      </h1>
      {pass && (
        <div className="mt-10 border border-paper/15 p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-mist">
            revealed to this portal
          </div>
          <dl className="mt-4 space-y-3">
            {disclosed.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <dt className="text-mist">{labelFor(key, labels)}</dt>
                <dd className="text-acid">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 font-mono text-sm text-paper-dim">
            {hiddenCount} of {total} claims hidden
          </p>
        </div>
      )}
      {session.result?.ephemeralDid && (
        <p className="mt-6 break-all font-mono text-xs text-mist">
          ephemeral {session.result.ephemeralDid}
        </p>
      )}
      <ChainNote chain={session.result?.chain} />
      <Button type="button" tone="ghost" className="mt-10" onClick={onReset}>
        Next person
      </Button>
    </div>
  );
}
