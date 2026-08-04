import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-semibold tracking-tight", className)}>
      <LogoMark className="size-7" />
      <span className="text-lg">
        Web<span className="text-brand">Syner</span>
      </span>
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <linearGradient id="ws-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--lime)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#ws-grad)" />
      <path
        d="M7 11.5L12 21.5L16 14.5L20 21.5L25 11.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
