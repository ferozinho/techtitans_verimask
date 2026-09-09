import Link from "next/link";
import { MaskMark } from "@/components/Brand";

const doors = [
  {
    href: "/issuer",
    n: "01",
    title: "Issue",
    copy: "Stamp a bundle at onboarding. Employer file, event pass, campus, staff — same credential, different claims.",
  },
  {
    href: "/holder",
    n: "02",
    title: "Hold",
    copy: "Wallet. Disclose only what the verifier asked. One-time DID. Fifteen minutes.",
  },
  {
    href: "/kiosk",
    n: "03",
    title: "Verify",
    copy: "Pick a pack: anonymous source, gate, hiring desk. Portal learns a subset. Chain receipt: types + pass/fail, no values.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-dvh">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-3">
          <MaskMark className="h-9 w-9 text-acid" />
          <span className="text-lg font-semibold tracking-[0.22em]">VERIMASK</span>
        </div>
        <p className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-mist sm:block">
          selective disclosure identity
        </p>
      </header>

      <section className="px-6 pb-8 pt-10 md:px-12 md:pt-20">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-acid">
          PS4 · decentralized identity
        </p>
        <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[0.95] md:text-8xl">
          Prove the source
          <br />
          is real.
          <br />
          Never prove who
          <br />
          they are.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-paper-dim md:text-xl">
          A hospital stamps an employment file at onboarding. At a hotline the
          portal learns “employed at Hospital X” — not a name, ID, or
          department. Same stamp still works at a gate or a hiring desk. A chain
          receipt records that a check happened, never who you are.
        </p>
      </section>

      <section className="grid gap-px border-y border-paper/15 bg-paper/5 md:grid-cols-3">
        {doors.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className="group bg-ink px-6 py-10 transition hover:bg-ink-2 md:px-10"
          >
            <div className="font-mono text-[11px] text-acid">{door.n}</div>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight group-hover:text-acid">
              {door.title}
            </h2>
            <p className="mt-4 max-w-sm text-paper-dim">{door.copy}</p>
            <div className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-mist group-hover:text-acid">
              enter →
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
