"use client";

import { Section, Container, SectionHeading } from "@/components/ui/section";
import { compareRows, pricingPlans } from "@/data/pricing";
import { Check, Minus } from "lucide-react";

export function Compare() {
  return (
    <Section id="compare" className="bg-secondary/30 border-y border-border">
      <Container>
        <SectionHeading
          eyebrow="Compare"
          title={<>Pick a plan in under a minute</>}
          description="A side-by-side view to make the trade-offs explicit."
        />
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="p-4 md:p-6 font-medium text-muted-foreground w-1/3">Feature</th>
                {pricingPlans.map((p) => (
                  <th key={p.id} className="p-4 md:p-6 font-semibold font-display">
                    {p.name}
                    <div className="text-xs font-normal text-muted-foreground mt-0.5">{p.price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-0">
                  <td className="p-4 md:p-6 font-medium text-foreground/90">{row.feature}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="p-4 md:p-6 text-foreground/85">
                      {v === "✓" ? (
                        <Check className="size-4 text-brand" />
                      ) : v === "—" ? (
                        <Minus className="size-4 text-muted-foreground/50" />
                      ) : (
                        <span>{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </Section>
  );
}
