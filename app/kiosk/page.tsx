"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Wordmark } from "@/components/Brand";
import { Button } from "@/components/ui";
import { tenthsToGpa } from "@/lib/crypto";
import type { VerifySession } from "@/lib/types";
import { loadKiosk } from "@/lib/wallet";

export default function KioskPage() {
  const [session, setSession] = useState<VerifySession | null>(null);
  const [origin, setOrigin] = useState("");
  const [durable, setDurable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mint = useCallback(async () => {
    setError(null);
    const kiosk = loadKiosk();
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        verifierDid: kiosk.did,
        disclose: ["degree"],
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
    mint();
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

  return (
    <div className="relative min-h-dvh px-6 py-6 md:px-10">
      <header className="flex items-center justify-between">
        <Wordmark />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist">
          verifier kiosk
        </span>
      </header>

      {session?.status === "pending" && (
        <div className="mx-auto mt-10 grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-acid">
              present claims
            </p>
            <h1 className="mt-4 text-5xl font-semibold md:text-7xl">
              Scan to prove.
            </h1>
            <ul className="mt-8 space-y-3 text-xl text-paper-dim">
              <li>age ≥ {session.request.ageGte}</li>
              <li>gpa ≥ {tenthsToGpa(session.request.gpaGte)}</li>
              <li>degree (revealed)</li>
            </ul>
            <p className="mt-8 max-w-md font-mono text-xs text-mist">
              Proof window 15 minutes. Pairwise DID. Phone camera opens the
              wallet. Same-laptop: open holder from the link under the QR.
            </p>
            {!durable && (
              <p className="mt-4 text-sm text-signal">
                No Redis on this deploy — fine for local. Add Upstash on Vercel
                so the kiosk and phone share state.
              </p>
            )}
            <Button type="button" tone="ghost" className="mt-8" onClick={mint}>
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
        <Result
          tone="pass"
          title="PASS"
          session={session}
          onReset={mint}
        />
      )}
      {(session?.status === "fail" || session?.status === "expired") && (
        <Result
          tone="fail"
          title={session.status === "expired" ? "EXPIRED" : "FAIL"}
          session={session}
          onReset={mint}
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
  return (
    <div className="mx-auto mt-16 max-w-4xl text-center">
      <div
        className={`inline-block px-8 py-3 font-mono text-sm tracking-[0.3em] ${
          pass ? "bg-acid text-ink" : "bg-signal text-ink"
        }`}
      >
        {pass ? "predicates hold" : session.result?.reason ?? "rejected"}
      </div>
      <h1
        className={`mt-8 text-8xl font-semibold md:text-[9rem] ${
          pass ? "text-acid" : "text-signal"
        }`}
      >
        {title}
      </h1>
      <p className="mt-6 text-paper-dim">
        age ≥ {session.request.ageGte} · gpa ≥ {tenthsToGpa(session.request.gpaGte)}
      </p>
      {session.result?.disclosed.degree && (
        <p className="mt-4 text-2xl">{session.result.disclosed.degree}</p>
      )}
      {session.result?.ephemeralDid && (
        <p className="mt-6 break-all font-mono text-xs text-mist">
          ephemeral {session.result.ephemeralDid}
        </p>
      )}
      <Button type="button" tone="ghost" className="mt-12" onClick={onReset}>
        Next person
      </Button>
    </div>
  );
}
