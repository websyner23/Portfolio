"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import { Section, Container, SectionHeading } from "@/components/ui/section";
import type { ApiPortfolioCategory, ApiPortfolioItem } from "@/lib/content";
import { cn } from "@/lib/utils";

type Props = {
  items: ApiPortfolioItem[];
  categories: ApiPortfolioCategory[];
  eyebrow?: string;
  title?: string;
  description?: string;
};

const PAGE_SIZE = 6;

export function PortfolioGrid({
  items,
  categories,
  eyebrow = "Selected work",
  title = "Real projects, real outcomes",
  description = "A slice of recent work across categories. Every case study includes the constraints, the choices, and the numbers.",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "all";
  const activeTag = searchParams.get("tag");
  const query = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(query);
  const [visible, setVisible] = useState(PAGE_SIZE);

  /** Filters live in the URL so a filtered view can be shared or bookmarked. */
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const queryString = params.toString();
      router.replace(queryString ? `/portfolio?${queryString}` : "/portfolio", {
        scroll: false,
      });
      setVisible(PAGE_SIZE);
    },
    [router, searchParams]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      if (activeCategory !== "all" && item.category?.slug !== activeCategory) {
        return false;
      }
      if (activeTag && !item.tags?.includes(activeTag)) {
        return false;
      }
      if (needle) {
        const haystack = [
          item.title,
          item.client,
          item.summary,
          ...(item.tags ?? []),
          ...(item.techStack ?? []),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [items, activeCategory, activeTag, query]);

  const countFor = (slug: string) =>
    slug === "all"
      ? items.length
      : items.filter((item) => item.category?.slug === slug).length;

  const chips = [{ _id: "all", name: "All", slug: "all", order: 0 }, ...categories];

  const shown = filtered.slice(0, visible);
  const hasFilters = activeCategory !== "all" || Boolean(activeTag) || Boolean(query);

  return (
    <Section id="work">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />

        {/* Search + category chips */}
        <div className="mb-8 flex flex-col items-center gap-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", search.trim() || null);
            }}
            className="relative w-full max-w-md"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => setParam("q", search.trim() || null)}
              placeholder="Search projects, clients, or tech…"
              aria-label="Search projects"
              className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-ring/30"
            />
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {chips.map((cat) => {
              const isActive = activeCategory === cat.slug;
              const count = countFor(cat.slug);
              if (count === 0 && cat.slug !== "all") return null;

              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setParam("category", cat.slug)}
                  aria-pressed={isActive}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "border-brand bg-brand text-brand-foreground shadow-sm shadow-brand/20"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {cat.name}
                  <span className="ml-2 text-xs opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Active filter summary */}
          {hasFilters && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "project" : "projects"}
              </span>
              {activeTag && (
                <button
                  type="button"
                  onClick={() => setParam("tag", null)}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:border-foreground/30"
                >
                  {activeTag}
                  <X className="size-3" />
                </button>
              )}
              <Link
                href="/portfolio"
                onClick={() => setSearch("")}
                className="text-xs font-medium text-brand-ink hover:underline"
              >
                Clear all
              </Link>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="font-display text-lg font-semibold">No matching projects</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Try a different category or clear the filters.
            </p>
            <Link
              href="/portfolio"
              onClick={() => setSearch("")}
              className="mt-4 inline-block text-sm font-medium text-brand-ink hover:underline"
            >
              Show all projects
            </Link>
          </div>
        ) : (
          <>
            <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {shown.map((p, i) => (
                  <motion.article
                    key={p.slug}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, delay: i * 0.03 }}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-brand/40"
                  >
                    <Link href={`/portfolio/${p.slug}`} className="block">
                      <div className="relative aspect-16/11 overflow-hidden">
                        {p.coverImage?.url ? (
                          <Image
                            src={p.coverImage.url}
                            alt={p.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          // Gradient colours come from the API as hex values —
                          // Tailwind can't generate classes for DB-stored values.
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${p.colors?.from ?? "#0fcda1"}44, ${p.colors?.to ?? "#1e2d40"}55)`,
                            }}
                          >
                            <div className="absolute inset-0 bg-dot opacity-30" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="px-6 text-center">
                                <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/60">
                                  {p.client}
                                </div>
                                <div className="mt-2 font-display text-xl font-semibold leading-tight text-foreground/90 md:text-2xl">
                                  {p.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {p.category && (
                          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
                            {p.category.name}
                          </div>
                        )}
                        <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-2.5 py-1 font-mono text-[11px] backdrop-blur">
                          {p.year}
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="line-clamp-1 font-display text-base font-semibold">
                          {p.client}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {p.summary}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-4">
                          {p.metrics?.slice(0, 2).map((m) => (
                            <div key={m.label}>
                              <div className="font-display text-sm font-semibold text-foreground">
                                {m.value}
                              </div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {m.label}
                              </div>
                            </div>
                          ))}
                          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand-ink">
                            View case study
                            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>

            {visible < filtered.length && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-brand/50 hover:text-brand-ink"
                >
                  Show more ({filtered.length - visible} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </Container>
    </Section>
  );
}
