"use client";

import { useEffect, useState } from "react";
import { Button, Field, inputClass, Shell } from "@/components/ui";
import { issueCredential } from "@/lib/credential";
import { ageFromDob, generateKeypair, shortDid } from "@/lib/crypto";
import type { HolderBundle, IssuerProfile } from "@/lib/types";
import { loadIssuer, saveHolder, saveIssuer } from "@/lib/wallet";

const demos = {
  pass: {
    name: "Ada Okonkwo",
    dob: "2003-04-11",
    gpa: "3.8",
    degree: "B.Tech",
    program: "Computer Science",
  },
  fail: {
    name: "Ravi Mehta",
    dob: "2004-09-02",
    gpa: "3.1",
    degree: "B.Tech",
    program: "Mechanical Engineering",
  },
};

export default function IssuerPage() {
  const [issuer, setIssuer] = useState<IssuerProfile | null>(null);
  const [college, setCollege] = useState("National Institute of Design");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gpa, setGpa] = useState("");
  const [degree, setDegree] = useState("B.Tech");
  const [program, setProgram] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<HolderBundle | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadIssuer();
    if (existing) {
      setIssuer(existing);
      setCollege(existing.college);
    }
  }, []);

  function ensureIssuer(): IssuerProfile {
    if (issuer) {
      const next = { ...issuer, college };
      saveIssuer(next);
      setIssuer(next);
      return next;
    }
    const keys = generateKeypair();
    const created: IssuerProfile = {
      ...keys,
      college,
    };
    saveIssuer(created);
    setIssuer(created);
    return created;
  }

  function fill(kind: keyof typeof demos) {
    const d = demos[kind];
    setName(d.name);
    setDob(d.dob);
    setGpa(d.gpa);
    setDegree(d.degree);
    setProgram(d.program);
  }

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const profile = ensureIssuer();
      const bundle = await issueCredential({
        issuer: profile,
        name,
        dob,
        gpa: Number(gpa),
        degree,
        program,
      });
      saveHolder(bundle);
      setIssued(bundle);
      const res = await fetch("/api/pickup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(bundle),
      });
      const data = await res.json();
      if (res.ok) setCode(data.code);
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

  return (
    <Shell role="issuer · college desk">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-acid">
            issuance
          </p>
          <h1 className="mt-3 text-5xl font-semibold">Stamp a credential.</h1>
          <p className="mt-4 max-w-lg text-paper-dim">
            Age and GPA are hashed into Poseidon commitments. The kiosk never
            sees the numbers — only a range proof later.
          </p>

          <form onSubmit={onIssue} className="mt-10 grid gap-5">
            <Field label="college">
              <input
                className={inputClass()}
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                required
              />
            </Field>
            <Field label="student name">
              <input
                className={inputClass()}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="date of birth">
                <input
                  type="date"
                  className={inputClass()}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </Field>
              <Field label="gpa">
                <input
                  inputMode="decimal"
                  className={inputClass()}
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="3.8"
                  required
                />
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="degree">
                <input
                  className={inputClass()}
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  required
                />
              </Field>
              <Field label="program">
                <input
                  className={inputClass()}
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  required
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? "Signing…" : "Issue credential"}
              </Button>
              <Button type="button" tone="ghost" onClick={() => fill("pass")}>
                Demo pass
              </Button>
              <Button type="button" tone="ghost" onClick={() => fill("fail")}>
                Demo fail
              </Button>
            </div>
            {dob && (
              <p className="font-mono text-xs text-mist">
                computed age {ageFromDob(dob)}
              </p>
            )}
            {error && <p className="text-signal">{error}</p>}
          </form>
        </div>

        <aside className="border border-paper/15 bg-ink-2 p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
            issuer did
          </div>
          <p className="mt-3 break-all font-mono text-sm text-acid">
            {issuer ? shortDid(issuer.did) : "will be created on first stamp"}
          </p>
          {issued && (
            <div className="mt-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
                last issuance
              </div>
              <p className="mt-3 text-2xl">{issued.secrets.name.value}</p>
              <p className="mt-1 text-paper-dim">
                {issued.secrets.degree.value} · {issued.secrets.program.value}
              </p>
              <p className="mt-6 font-mono text-xs text-mist">
                committed to this browser’s holder wallet.
              </p>
              {code && (
                <div className="stamp mt-6 bg-acid px-5 py-4 text-ink">
                  <div className="font-mono text-[11px] uppercase tracking-[0.18em]">
                    pickup code
                  </div>
                  <div className="mt-2 font-mono text-4xl tracking-[0.2em]">
                    {code}
                  </div>
                  <p className="mt-2 text-sm">
                    Phone wallet: enter this on /holder. Dies in 15 min.
                  </p>
                </div>
              )}
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
