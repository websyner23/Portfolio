import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, Clock, Tag } from "lucide-react";
import { PageBanner } from "@/components/sections/page-banner";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaqSection } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";
import { services, getServiceBySlug } from "@/data/services";

type Params = { slug: string };

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Service not found" };
  return {
    title: service.title,
    description: service.summary,
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();
  const Icon = service.icon;

  const others = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <PageBanner
        eyebrow={service.short}
        title={service.title}
        description={service.summary}
        breadcrumbs={[{ label: "Services", href: "/services" }, { label: service.title }]}
        actions={
          <>
            <Button asChild size="lg" variant="brand">
              <Link href={`/contact?service=${service.slug}`}>
                Start this engagement
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/process">See process</Link>
            </Button>
          </>
        }
      />

      <Section className="border-y border-border bg-secondary/30 py-12 md:py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <Stat icon={Tag} label="Starting at" value={service.startingPrice} />
            <Stat icon={Clock} label="Typical timeline" value={service.timeline} />
            <Stat icon={Icon} label="Practice" value={service.title.split(" ")[0]} />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <SectionHeading
                eyebrow="What you walk away with"
                title={<>Outcomes worth paying for</>}
                description="A short list of things that should be measurably better after we finish."
                align="left"
                className="mb-8"
              />
              <ul className="space-y-3">
                {service.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                    <Check className="mt-0.5 size-5 shrink-0 text-brand" />
                    <span className="text-foreground/90">{o}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-5">
              <div className="sticky top-28 rounded-2xl border border-border bg-card p-7 md:p-8">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Deliverables
                </div>
                <h3 className="mt-2 text-xl font-semibold font-display">What's in the box</h3>
                <ul className="mt-5 space-y-2.5">
                  {service.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span className="text-foreground/85">{d}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Stack & Tooling
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {service.techHighlights.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-secondary/30 border-y border-border">
        <Container>
          <SectionHeading
            eyebrow="How it runs"
            title={<>The phases of this engagement</>}
            description="Every milestone has a deliverable, an exit criterion, and a defined revision window."
          />
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {service.process.map((p, i) => (
              <li
                key={p.title}
                className="relative rounded-2xl border border-border bg-card p-6"
              >
                <div className="text-xs font-mono text-brand">/ {String(i + 1).padStart(2, "0")}</div>
                <div className="mt-3 text-base font-semibold font-display">{p.title}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <FaqSection items={service.faqs} title={<>Common questions about this service</>} />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Other practices"
            title={<>Often paired with</>}
            description="These services frequently run together as part of a larger engagement."
            align="center"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {others.map((s) => {
              const OIcon = s.icon;
              return (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="group rounded-2xl border border-border bg-card p-6 hover:border-brand/40 transition-colors"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <OIcon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold font-display">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{s.short}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand">
                    View details
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>

      <Cta />
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ArrowUpRight;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-base md:text-lg font-semibold font-display">{value}</div>
      </div>
    </div>
  );
}
