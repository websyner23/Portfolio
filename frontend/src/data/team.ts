export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image?: string;
  initials: string;
  linkedin?: string;
};

export const team: TeamMember[] = [
  {
    name: "Ihsan Habib",
    role: "Founder & Creative Director",
    bio: "Twelve years across agency and product. Spent too long fixing slow Next.js sites and finally started a studio that does it right.",
    initials: "IH",
    linkedin: "https://www.linkedin.com/in/ihsan-habib",
  },
  {
    name: "Maya Okafor",
    role: "Design Lead",
    bio: "Brand systems and motion. Previously at two design-led SaaS companies you'd recognize.",
    initials: "MO",
  },
  {
    name: "Diego Santos",
    role: "Engineering Lead",
    bio: "TypeScript everywhere. Owns the bar for performance, accessibility, and code quality.",
    initials: "DS",
  },
  {
    name: "Priya Kapoor",
    role: "SEO & Content Strategist",
    bio: "Built organic channels from zero to seven figures. Allergic to keyword stuffing.",
    initials: "PK",
  },
  {
    name: "Tomás Bauer",
    role: "Senior Product Designer",
    bio: "Product surfaces, design systems, and the unglamorous edge cases that make software feel good.",
    initials: "TB",
  },
  {
    name: "Aiko Tanaka",
    role: "Project Director",
    bio: "Keeps every engagement on rails. Former PM at a global e-commerce platform.",
    initials: "AT",
  },
];

/** API-shaped ids for the offline fallback path (src/lib/content.ts). */
export const teamFallback = team.map((member, i) => ({
  ...member,
  _id: `${member.name}-${i}`,
}));
