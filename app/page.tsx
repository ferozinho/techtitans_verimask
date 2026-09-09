import Link from "next/link";
import { MaskMark } from "@/components/Brand";

const doors = [
  {
    href: "/issuer",
    n: "01",
    title: "Issue",
    copy: "College desk. Sign a student credential. The numbers stay with the holder.",
  },
  {
    href: "/holder",
    n: "02",
    title: "Hold",
    copy: "Wallet. Hide fields, prove ranges, spend a one-time DID at the kiosk.",
  },
  {
    href: "/kiosk",
    n: "03",
    title: "Verify",
    copy: "Kiosk QR. Live pass/fail. Age ≥ 18 and GPA ≥ 3.5, no raw values.",
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
          zk student credentials
        </p>
      </header>

      <section className="px-6 pb-8 pt-10 md:px-12 md:pt-20">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-acid">
          campus · hiring · door
        </p>
        <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] md:text-8xl">
          Prove the
          <br />
          threshold.
          <br />
          Keep the number.
        </h1>
        <p className="mt-8 max-w-xl text-lg text-paper-dim md:text-xl">
          Age ≥ 18 and GPA ≥ 3.5, in zero knowledge. A fresh identity every
          scan. The proof dies in fifteen minutes.
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
