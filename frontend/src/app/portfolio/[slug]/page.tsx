import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { Cta } from "@/components/sections/cta";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/section";
import { getPortfolio, getPortfolioItem } from "@/lib/content";

type Params = { slug: string };

export async function generateStaticParams() {
  const { data } = await getPortfolio();
  return data.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPortfolioItem(slug);

  if (!result?.item) {
    return { title: "Project not found" };
  }

  return {
    title: result.item.title,
    description: result.item.summary,
    openGraph: {
      title: result.item.title,
      description: result.item.summary,
      images: result.item.coverImage?.url
        ? [result.item.coverImage.url]
        : undefined,
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const result = await getPortfolioItem(slug);

  if (!result?.item) notFound();

  const { item, prev, next } = result;

  return (
    <>
      <Section className="pt-10 md:pt-16">
        <Container>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            All work
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                {item.category && (
                  <Link
                    href={`/portfolio?category=${item.category.slug}`}
                    className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-brand/50 hover:text-brand-ink"
                  >
                    {item.category.name}
                  </Link>
                )}
                <span className="rounded-full border border-border px-3 py-1 font-mono text-xs">
                  {item.year}
                </span>
              </div>

              <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
                {item.title}
              </h1>
              <p className="mt-3 font-mono text-sm uppercase tracking-wider text-muted-foreground">
                {item.client}
              </p>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {item.summary}
              </p>

              {item.liveUrl && (
                <div className="mt-8">
                  <Button asChild size="lg" variant="brand">
                    <a href={item.liveUrl} target="_blank" rel="noopener noreferrer">
                      View live site
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border">
                {item.coverImage?.url ? (
                  <Image
                    src={item.coverImage.url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${item.colors?.from ?? "#0fcda1"}44, ${item.colors?.to ?? "#1e2d40"}55)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-dot opacity-30" />
                    <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
                      <span className="font-display text-2xl font-semibold text-foreground/90">
                        {item.client}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Outcome metrics */}
          {item.metrics?.length > 0 && (
            <div className="mt-12 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3 md:mt-16">
              {item.metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="font-display text-3xl font-semibold text-brand-ink">
                    {metric.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Case study body */}
      {item.body && (
        <Section className="pt-0">
          <Container>
            <article
              className="prose prose-neutral max-w-3xl dark:prose-invert prose-headings:font-display prose-a:text-brand-ink"
              dangerouslySetInnerHTML={{ __html: item.body }}
            />
          </Container>
        </Section>
      )}

      {/* Gallery */}
      {item.gallery && item.gallery.length > 0 && (
        <Section className="pt-0">
          <Container>
            <div className="grid gap-4 sm:grid-cols-2">
              {item.gallery.map((shot, i) => (
                <figure
                  key={shot.url}
                  className="overflow-hidden rounded-2xl border border-border"
                >
                  <div className="relative aspect-16/10">
                    <Image
                      src={shot.url}
                      alt={shot.caption ?? `${item.title} — image ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  {shot.caption && (
                    <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                      {shot.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Tags, tech stack and neighbour navigation */}
      <Section className="pt-0">
        <Container>
          <div className="grid gap-8 border-t border-border pt-10 md:grid-cols-2">
            {item.tags?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Focus areas
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/portfolio?tag=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-brand/50 hover:text-brand-ink"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {item.techStack?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Built with
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-secondary px-3 py-1 font-mono text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <nav className="mt-10 flex flex-col gap-3 border-t border-border pt-10 sm:flex-row sm:justify-between">
            {prev ? (
              <Link
                href={`/portfolio/${prev.slug}`}
                className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="line-clamp-1">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/portfolio/${next.slug}`}
                className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:text-right"
              >
                <span className="line-clamp-1">{next.title}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </nav>

          <div className="mt-10 text-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/portfolio">
                Browse all work
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Container>
      </Section>

      <Cta />
    </>
  );
}
