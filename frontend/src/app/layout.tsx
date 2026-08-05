import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getSite, getSiteSettings } from "@/lib/content";
import { buildThemeCss } from "@/lib/theme-css";
import { themeInitScript } from "@/lib/theme";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings.seo?.metaTitle ?? settings.brandName;
  const description = settings.seo?.metaDescription ?? settings.description;

  return {
    title: {
      default: `${settings.brandName} — ${settings.tagline}`,
      template: `%s — ${settings.brandName}`,
    },
    description,
    metadataBase: settings.url ? new URL(settings.url) : undefined,
    openGraph: {
      title: `${title} — ${settings.tagline}`,
      description,
      url: settings.url,
      siteName: settings.brandName,
      type: "website",
      images: settings.seo?.ogImage ? [settings.seo.ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${settings.tagline}`,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { settings, theme } = await getSite();

  // Colours configured in the admin panel override the defaults in
  // globals.css. Rendered server-side so there's no flash of the old palette.
  const themeCss = buildThemeCss(theme);
  const initialMode = theme?.defaultMode ?? "dark";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${mono.variable} h-full antialiased ${initialMode}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {themeCss && (
          <style
            id="websyner-theme"
            dangerouslySetInnerHTML={{ __html: themeCss }}
          />
        )}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>
          <Navbar settings={settings} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
        </Providers>
      </body>
    </html>
  );
}
