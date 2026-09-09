import Link from "next/link";

export function MaskMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden
    >
      <path
        d="M5 12.2C10.2 5.4 21.8 5.4 27 12.2v8.1C21.8 27.1 10.2 27.1 5 20.3v-8.1Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M11 16.8h10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.2 20.4c2.4 1.6 5.2 1.6 7.6 0" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-3 text-paper">
      <MaskMark />
      <span className="text-xl font-semibold tracking-[0.18em]">VERIMASK</span>
    </Link>
  );
}
