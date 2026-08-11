"use client";

import { motion } from "framer-motion";
import { LinkedinIcon } from "@/components/brand/social-icons";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { teamFallback } from "@/data/team";
import type { ApiTeamMember } from "@/lib/content";

export function Team({
  items = teamFallback,
}: {
  items?: ApiTeamMember[];
} = {}) {
  return (
    <Section id="team">
      <Container>
        <SectionHeading
          eyebrow="Meet the team"
          title={<>Senior people, in the room with you</>}
          description="The people you meet on your kickoff call are the people doing the work. No layered handoffs."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m, i) => (
            <motion.article
              key={m.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-brand/40 transition-colors"
            >
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-5 bg-gradient-to-br from-brand/15 via-secondary to-navy/12 flex items-center justify-center">
                <div className="text-5xl md:text-6xl font-semibold font-display text-foreground/40">
                  {m.initials}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/70 to-transparent" />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold font-display">{m.name}</h3>
                  <p className="text-sm text-brand-ink">{m.role}</p>
                </div>
                {m.linkedin ? (
                  <a
                    href={m.linkedin}
                    aria-label={`${m.name} on LinkedIn`}
                    className="inline-flex size-8 items-center justify-center rounded-full border border-border hover:border-brand hover:text-brand-ink transition-colors"
                  >
                    <LinkedinIcon className="size-3.5" />
                  </a>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.bio}</p>
            </motion.article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
