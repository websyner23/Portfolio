import * as React from "react";
import { cn } from "@/lib/utils";

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  id?: string;
  bleed?: boolean;
};

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, bleed, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        "relative w-full",
        bleed ? "" : "py-20 md:py-28",
        className
      )}
      {...props}
    />
  )
);
Section.displayName = "Section";

export const Container = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("container-page", className)} {...props} />
  )
);
Container.displayName = "Container";

type SectionHeadingProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12 md:mb-16 max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? (
        <div
          className={cn(
            "mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground",
            align === "center" ? "mx-auto" : ""
          )}
        >
          <span className="size-1.5 rounded-full bg-brand" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl font-display">{title}</h2>
      {description ? (
        <p className="mt-5 text-base md:text-lg text-muted-foreground text-pretty leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}
