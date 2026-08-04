import Image from "next/image";
import { cn } from "@/lib/utils";
import logoLight from "../../../public/web_syner_logo.png";
import logoDark from "../../../public/web_syner_logo_dark.png";

/**
 * Master lockup from `public/`. The dark file is the same artwork with the
 * navy ink swapped for the light foreground, so the mark stays legible on
 * dark surfaces; CSS picks one per theme.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-10 items-center md:h-12", className)}>
      <Image
        src={logoLight}
        alt="WebSyner"
        width={304}
        height={200}
        priority
        className="h-full w-auto dark:hidden"
      />
      <Image
        src={logoDark}
        alt=""
        aria-hidden
        width={304}
        height={200}
        priority
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}
