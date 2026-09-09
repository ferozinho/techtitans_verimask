import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "./Brand";

export function Shell({
  children,
  role,
}: {
  children: ReactNode;
  role: string;
}) {
  return (
    <div className="relative min-h-dvh">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Wordmark />
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist">
          {role}
        </div>
      </header>
      <main className="px-6 pb-16 md:px-10">{children}</main>
      <footer className="px-6 pb-8 font-mono text-[11px] text-mist md:px-10">
        <Link href="/" className="hover:text-acid">
          ← roles
        </Link>
      </footer>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
        {label}
      </span>
      {children}
    </label>
  );
}

export function inputClass() {
  return "w-full border border-paper/20 bg-ink-2 px-3 py-3 font-mono text-sm text-paper outline-none focus:border-acid";
}

export function Button({
  children,
  tone = "acid",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "acid" | "ghost" | "signal";
}) {
  const tones = {
    acid: "bg-acid text-ink hover:bg-paper",
    ghost: "border border-paper/25 text-paper hover:border-acid hover:text-acid",
    signal: "bg-signal text-ink hover:bg-paper",
  };
  return (
    <button
      {...props}
      className={`px-5 py-3 font-semibold tracking-wide disabled:opacity-40 ${tones[tone]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
