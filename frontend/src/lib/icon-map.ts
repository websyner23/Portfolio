import {
  Award,
  BarChart3,
  Clock,
  Cloud,
  Code2,
  Compass,
  Globe,
  Globe2,
  Handshake,
  Heart,
  HeartHandshake,
  Layout,
  LineChart,
  PenTool,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * The API stores icons as names (React components aren't serializable), so
 * components resolve them back through this map. Unknown names fall back to
 * Sparkles rather than crashing the page. Keep in sync with ICON_OPTIONS in
 * admin/src/pages/cms/ContentPages.tsx.
 */
const ICONS: Record<string, LucideIcon> = {
  Award,
  BarChart3,
  Clock,
  Cloud,
  Code2,
  Compass,
  Globe,
  Globe2,
  Handshake,
  Heart,
  HeartHandshake,
  Layout,
  LineChart,
  PenTool,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
};

export const getIcon = (name?: string): LucideIcon =>
  (name && ICONS[name]) || Sparkles;

export const iconNames = Object.keys(ICONS).sort();
