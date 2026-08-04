export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  rating?: number;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Our new site shipped in five weeks and pipeline jumped 40% the next quarter. The team felt like an extension of ours.",
    name: "Sarah Hollis",
    role: "VP Marketing",
    company: "Northwind Logistics",
    initials: "SH",
    rating: 5,
  },
  {
    quote:
      "Hands down the most thoughtful design partner we've worked with. They asked the questions we should have been asking ourselves.",
    name: "Marcus Lee",
    role: "Founder",
    company: "Atlas Health",
    initials: "ML",
    rating: 5,
  },
  {
    quote:
      "We went from a Webflow site that nobody wanted to update to a proper component system the whole team can ship into.",
    name: "Elena Rossi",
    role: "Head of Brand",
    company: "Lumen Studio",
    initials: "ER",
    rating: 5,
  },
  {
    quote:
      "The SEO program paid for itself in two months. Real strategy, no fluff, monthly reporting we actually open.",
    name: "Daniel Park",
    role: "CMO",
    company: "Cobalt Outdoors",
    initials: "DP",
    rating: 5,
  },
  {
    quote:
      "They built our internal ops tool in eight weeks and saved our team about fifteen hours each per week. ROI was obvious.",
    name: "Aisha Patel",
    role: "COO",
    company: "Beacon Realty",
    initials: "AP",
    rating: 5,
  },
  {
    quote:
      "Most agencies sell you a deck. WebSyner sold us an outcome and then delivered it. We're already on engagement two.",
    name: "Jonas Weber",
    role: "Founder & CEO",
    company: "Foreground.ai",
    initials: "JW",
    rating: 5,
  },
];
