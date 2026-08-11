import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageBanner } from "@/components/sections/page-banner";
import { MissionVision } from "@/components/sections/mission-vision";
import { Team } from "@/components/sections/team";
import { WhyChoose } from "@/components/sections/why-choose";
import { Drivers } from "@/components/sections/drivers";
import { Cta } from "@/components/sections/cta";
import { Button } from "@/components/ui/button";
import { getStats, getTeam, statsByGroup } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "WebSyner is a senior, remote-first studio building modern websites, brands, and software for ambitious teams worldwide.",
};

export default async function AboutPage() {
  const [stats, team] = await Promise.all([getStats(), getTeam()]);

  return (
    <>
      <PageBanner
        eyebrow="About WebSyner"
        title={
          <>
            We&apos;re a small studio with a{" "}
            <span className="bg-gradient-to-br from-brand-ink to-foreground bg-clip-text text-transparent">
              big standard
            </span>{" "}
            for craft.
          </>
        }
        description="WebSyner started as a side project between three friends who kept seeing the same problem: ambitious teams overpaying for slow, generic agency work. We built the studio we wished existed — small, senior, remote, and accountable."
        breadcrumbs={[{ label: "About" }]}
        actions={
          <>
            <Button asChild size="lg" variant="brand">
              <Link href="/contact">
                Work with us
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/portfolio">See our work</Link>
            </Button>
          </>
        }
      />
      <MissionVision />
      <Team items={team} />
      <WhyChoose items={statsByGroup(stats, "why-choose")} />
      <Drivers items={statsByGroup(stats, "drivers")} />
      <Cta />
    </>
  );
}
