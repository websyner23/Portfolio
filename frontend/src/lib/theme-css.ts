import type { ThemeSettings, ThemeTokens } from "./content";

/**
 * Maps the theme token names stored by the API to the CSS custom properties
 * declared in src/app/globals.css.
 */
const TOKEN_TO_CSS_VAR: Record<string, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  brand: "--brand",
  brandForeground: "--brand-foreground",
  brandInk: "--brand-ink",
  navy: "--navy",
  navyForeground: "--navy-foreground",
  logoInk: "--logo-ink",
};

const declarations = (tokens?: ThemeTokens) =>
  Object.entries(tokens ?? {})
    .filter(([key, value]) => TOKEN_TO_CSS_VAR[key] && value)
    .map(([key, value]) => `${TOKEN_TO_CSS_VAR[key]}: ${value};`)
    .join("");

/**
 * Builds a stylesheet that overrides the defaults in globals.css with the
 * colours configured in the admin panel. Rendered server-side in the root
 * layout, so there is no flash of the old palette, and Tailwind never needs to
 * know about these values at build time.
 */
export const buildThemeCss = (theme: ThemeSettings | null): string => {
  if (!theme) return "";

  const light = declarations(theme.light);
  const dark = declarations(theme.dark);
  const radius = theme.radius ? `--radius: ${theme.radius};` : "";

  const parts: string[] = [];
  if (light || radius) parts.push(`:root{${light}${radius}}`);
  if (dark) parts.push(`.dark{${dark}}`);

  return parts.join("");
};
