import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import {
  TwitterIcon,
  LinkedinIcon,
  InstagramIcon,
  DribbbleIcon,
  GithubIcon,
} from "@/components/brand/social-icons";
import { Logo } from "@/components/brand/logo";
import { site } from "@/data/site";
import { services } from "@/data/services";

const footerLinks = [
  {
    title: "Studio",
    links: [
      { label: "About", href: "/about" },
      { label: "Process", href: "/process" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Services",
    links: services.map((s) => ({ label: s.title, href: `/services/${s.slug}` })),
  },
  {
    title: "Resources",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/about#faq" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const socials = [
  { icon: TwitterIcon, href: site.social.twitter, label: "Twitter" },
  { icon: LinkedinIcon, href: site.social.linkedin, label: "LinkedIn" },
  { icon: InstagramIcon, href: site.social.instagram, label: "Instagram" },
  { icon: DribbbleIcon, href: site.social.dribbble, label: "Dribbble" },
  { icon: GithubIcon, href: site.social.github, label: "GitHub" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-secondary/30">
      <div className="container-page py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-5 max-w-sm text-muted-foreground leading-relaxed">
              {site.description}
            </p>
            <div className="mt-8 flex flex-col gap-2 text-sm">
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 hover:text-brand-ink transition-colors"
              >
                <Mail className="size-4" />
                {site.email}
              </a>
              <span className="text-muted-foreground">{site.address.line1} · {site.address.line2}</span>
            </div>
            <div className="mt-8 flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background hover:border-brand hover:text-brand-ink transition-colors"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {group.title}
                </h4>
                <ul className="mt-5 space-y-3">
                  {group.links.map((l) => (
                    <li key={`${group.title}-${l.label}`}>
                      <Link
                        href={l.href}
                        className="text-sm text-foreground/80 hover:text-brand-ink transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {site.name}. Built with care, worldwide.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-brand-ink transition-colors"
          >
            Have a project in mind? <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
