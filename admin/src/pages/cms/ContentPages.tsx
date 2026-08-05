import { Tag, Typography } from "antd";
import ResourceManager, {
  activeColumn,
  orderColumn,
  TField,
} from "../../components/cms/ResourceManager";
import { useGetCmsListQuery } from "../../redux/api/cmsApi";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Lucide icon names available to content editors. */
const ICON_OPTIONS = [
  "Award",
  "BarChart3",
  "Clock",
  "Cloud",
  "Code2",
  "Compass",
  "Globe",
  "Globe2",
  "Handshake",
  "Heart",
  "HeartHandshake",
  "Layout",
  "LineChart",
  "PenTool",
  "Rocket",
  "Search",
  "Shield",
  "Sparkles",
  "Star",
  "Target",
  "Users",
  "Zap",
].map((v) => ({ value: v, label: v }));

const truncate = (text?: string, len = 70) =>
  text && text.length > len ? `${text.slice(0, len)}…` : text;

/* ------------------------------- Services ------------------------------- */

export const ServicesPage = () => (
  <ResourceManager
    resource="services"
    title="Services"
    subtitle="The practices shown on the services page and homepage"
    searchPlaceholder="Search services"
    drawerWidth={720}
    columns={[
      orderColumn,
      { title: "Title", dataIndex: "title" },
      { title: "Slug", dataIndex: "slug", render: (v: string) => <Tag>{v}</Tag> },
      { title: "Icon", dataIndex: "icon", width: 100 },
      { title: "From", dataIndex: "startingPrice", width: 110 },
      activeColumn,
    ]}
    fields={[
      { name: "title", label: "Title", type: "text", required: true },
      {
        name: "slug",
        label: "Slug",
        type: "text",
        required: true,
        help: "URL segment, e.g. web-design",
      },
      { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
      { name: "short", label: "Short tagline", type: "text" },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "outcomes", label: "Outcomes", type: "list" },
      { name: "deliverables", label: "Deliverables", type: "list" },
      {
        name: "process",
        label: "Process steps",
        type: "pairs",
        pairKeys: ["title", "description"],
      },
      { name: "faqs", label: "FAQs", type: "pairs", pairKeys: ["q", "a"] },
      { name: "techHighlights", label: "Tech highlights", type: "list" },
      { name: "startingPrice", label: "Starting price", type: "text" },
      { name: "timeline", label: "Timeline", type: "text" },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
      { name: "isActive", label: "Visible on site", type: "switch", initialValue: true },
    ]}
  />
);

/* --------------------------- Portfolio categories --------------------------- */

export const PortfolioCategoriesPage = () => (
  <ResourceManager
    resource="portfolio-categories"
    title="Portfolio categories"
    subtitle="Filter chips shown above the portfolio grid"
    columns={[
      orderColumn,
      { title: "Name", dataIndex: "name" },
      { title: "Slug", dataIndex: "slug", render: (v: string) => <Tag>{v}</Tag> },
    ]}
    fields={[
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
    ]}
  />
);

/* ------------------------------- Portfolio ------------------------------- */

export const PortfolioPage = () => {
  const { data: categories } = useGetCmsListQuery({
    resource: "portfolio-categories",
    params: { limit: 100 },
  });

  const categoryOptions =
    categories?.data?.map((c: any) => ({ value: c._id, label: c.name })) ?? [];

  const fields: TField[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "slug", label: "Slug", type: "text", required: true },
    { name: "client", label: "Client", type: "text" },
    {
      name: "category",
      label: "Category",
      type: "select",
      required: true,
      options: categoryOptions,
    },
    { name: "summary", label: "Summary", type: "textarea" },
    {
      name: "body",
      label: "Case study",
      type: "richtext",
      help: "Shown on the project detail page",
    },
    {
      name: "coverImage",
      label: "Cover image",
      type: "image",
      help: "Falls back to the gradient colours below when empty",
    },
    {
      name: "liveUrl",
      label: "Live site / prototype URL",
      type: "text",
      placeholder: "https://…",
      help: "The 'View website' link on the project card",
    },
    { name: "metrics", label: "Metrics", type: "pairs", pairKeys: ["label", "value"] },
    { name: "tags", label: "Tags", type: "tags" },
    { name: "techStack", label: "Tech stack", type: "tags" },
    { name: "year", label: "Year", type: "number", initialValue: new Date().getFullYear() },
    { name: ["colors", "from"], label: "Gradient from", type: "color" },
    { name: ["colors", "to"], label: "Gradient to", type: "color" },
    { name: "featured", label: "Featured", type: "switch" },
    { name: "order", label: "Order", type: "number", initialValue: 99 },
    { name: "isPublished", label: "Published", type: "switch", initialValue: true },
  ];

  return (
    <ResourceManager
      resource="portfolio"
      title="Portfolio"
      subtitle="Case studies and prototypes shown on the portfolio page"
      searchPlaceholder="Search projects"
      drawerWidth={760}
      columns={[
        orderColumn,
        { title: "Project", dataIndex: "title" },
        { title: "Client", dataIndex: "client", width: 150 },
        {
          title: "Category",
          dataIndex: ["category", "name"],
          width: 130,
          render: (v: string) => (v ? <Tag>{v}</Tag> : "—"),
        },
        { title: "Year", dataIndex: "year", width: 80 },
        {
          title: "Status",
          dataIndex: "isPublished",
          width: 100,
          render: (v: boolean) => (
            <Tag color={v ? "green" : "default"}>{v ? "live" : "draft"}</Tag>
          ),
        },
      ]}
      fields={fields}
    />
  );
};

/* ------------------------------ Testimonials ------------------------------ */

export const TestimonialsPage = () => (
  <ResourceManager
    resource="testimonials"
    title="Testimonials"
    subtitle="Client quotes shown on the homepage and contact page"
    searchPlaceholder="Search testimonials"
    columns={[
      orderColumn,
      { title: "Name", dataIndex: "name" },
      { title: "Company", dataIndex: "company", width: 170 },
      {
        title: "Quote",
        dataIndex: "quote",
        render: (v: string) => (
          <Typography.Text type="secondary">{truncate(v)}</Typography.Text>
        ),
      },
      { title: "Rating", dataIndex: "rating", width: 80 },
      activeColumn,
    ]}
    fields={[
      { name: "quote", label: "Quote", type: "textarea", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role", type: "text" },
      { name: "company", label: "Company", type: "text" },
      { name: "initials", label: "Initials", type: "text", help: "Used when no avatar" },
      { name: "avatar", label: "Avatar", type: "image" },
      { name: "rating", label: "Rating (1–5)", type: "number", initialValue: 5 },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
      { name: "isActive", label: "Visible on site", type: "switch", initialValue: true },
    ]}
  />
);

/* --------------------------------- Team --------------------------------- */

export const TeamPage = () => (
  <ResourceManager
    resource="team"
    title="Team"
    subtitle="People shown on the about page"
    searchPlaceholder="Search team"
    columns={[
      orderColumn,
      { title: "Name", dataIndex: "name" },
      { title: "Role", dataIndex: "role" },
      activeColumn,
    ]}
    fields={[
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role", type: "text" },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "initials", label: "Initials", type: "text" },
      { name: "image", label: "Photo", type: "image" },
      { name: "linkedin", label: "LinkedIn URL", type: "text" },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
      { name: "isActive", label: "Visible on site", type: "switch", initialValue: true },
    ]}
  />
);

/* -------------------------------- Pricing -------------------------------- */

export const PricingPlansPage = () => (
  <ResourceManager
    resource="pricing-plans"
    title="Pricing plans"
    subtitle="The plan cards on the pricing page"
    columns={[
      orderColumn,
      { title: "Plan", dataIndex: "name" },
      { title: "Price", dataIndex: "price", width: 120 },
      { title: "Period", dataIndex: "period", width: 130 },
      {
        title: "Popular",
        dataIndex: "popular",
        width: 100,
        render: (v: boolean) => (v ? <Tag color="green">popular</Tag> : "—"),
      },
      activeColumn,
    ]}
    fields={[
      { name: "name", label: "Plan name", type: "text", required: true },
      { name: "planId", label: "Plan ID", type: "text", required: true, help: "e.g. launch" },
      { name: "price", label: "Price", type: "text" },
      { name: "period", label: "Period", type: "text", placeholder: "fixed scope" },
      { name: "blurb", label: "Blurb", type: "textarea" },
      { name: "features", label: "Features", type: "list" },
      { name: "popular", label: "Highlight as popular", type: "switch" },
      { name: ["cta", "label"], label: "CTA label", type: "text" },
      { name: ["cta", "href"], label: "CTA link", type: "text" },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
      { name: "isActive", label: "Visible on site", type: "switch", initialValue: true },
    ]}
  />
);

export const PricingExtrasPage = () => (
  <ResourceManager
    resource="pricing-extras"
    title="Pricing extras"
    subtitle="Add-on services listed under the plans"
    columns={[
      orderColumn,
      { title: "Extra", dataIndex: "title" },
      { title: "Price", dataIndex: "price", width: 120 },
      {
        title: "Description",
        dataIndex: "description",
        render: (v: string) => (
          <Typography.Text type="secondary">{truncate(v)}</Typography.Text>
        ),
      },
      activeColumn,
    ]}
    fields={[
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "price", label: "Price", type: "text" },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
      { name: "isActive", label: "Visible on site", type: "switch", initialValue: true },
    ]}
  />
);

export const CompareRowsPage = () => (
  <ResourceManager
    resource="compare-rows"
    title="Plan comparison"
    subtitle="Rows of the plan comparison table — one value per plan, in plan order"
    columns={[
      orderColumn,
      { title: "Feature", dataIndex: "feature" },
      {
        title: "Values",
        dataIndex: "values",
        render: (v: string[]) => (v ?? []).map((x, i) => <Tag key={i}>{x}</Tag>),
      },
    ]}
    fields={[
      { name: "feature", label: "Feature", type: "text", required: true },
      {
        name: "values",
        label: "Values per plan",
        type: "tags",
        help: "One entry per plan, left to right",
      },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
    ]}
  />
);

/* ---------------------------------- FAQs ---------------------------------- */

const FAQ_GROUPS = [
  { value: "general", label: "General (home/about)" },
  { value: "process", label: "Process page" },
  { value: "pricing", label: "Pricing page" },
  { value: "portfolio", label: "Portfolio page" },
];

export const FaqsPage = () => (
  <ResourceManager
    resource="faqs"
    title="FAQs"
    subtitle="Grouped by the page they appear on"
    searchPlaceholder="Search questions"
    columns={[
      orderColumn,
      { title: "Question", dataIndex: "q" },
      {
        title: "Group",
        dataIndex: "group",
        width: 130,
        render: (v: string) => <Tag>{v}</Tag>,
      },
      activeColumn,
    ]}
    fields={[
      { name: "q", label: "Question", type: "text", required: true },
      { name: "a", label: "Answer", type: "textarea", required: true },
      {
        name: "group",
        label: "Group",
        type: "select",
        options: FAQ_GROUPS,
        initialValue: "general",
        required: true,
      },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
      { name: "isActive", label: "Visible on site", type: "switch", initialValue: true },
    ]}
  />
);

/* -------------------------------- Process -------------------------------- */

const PROCESS_GROUPS = [
  { value: "step", label: "Main process step" },
  { value: "after-launch", label: "After launch" },
  { value: "summary", label: "Summary stat" },
];

export const ProcessPage = () => (
  <ResourceManager
    resource="process-steps"
    title="Process"
    subtitle="Steps, after-launch items and summary stats on the process page"
    drawerWidth={680}
    columns={[
      orderColumn,
      { title: "Step", dataIndex: "step", width: 70 },
      { title: "Title", dataIndex: "title" },
      { title: "Duration", dataIndex: "duration", width: 110 },
      {
        title: "Group",
        dataIndex: "group",
        width: 140,
        render: (v: string) => <Tag>{v}</Tag>,
      },
      activeColumn,
    ]}
    fields={[
      { name: "title", label: "Title", type: "text", required: true },
      { name: "step", label: "Step number", type: "text", placeholder: "01" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
      { name: "duration", label: "Duration", type: "text", placeholder: "Week 1" },
      { name: "bullets", label: "Bullets", type: "list" },
      {
        name: "stat",
        label: "Summary figure",
        type: "text",
        help: "Only used by summary entries, e.g. 4–16 wks",
      },
      {
        name: "group",
        label: "Group",
        type: "select",
        options: PROCESS_GROUPS,
        initialValue: "step",
        required: true,
      },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
      { name: "isActive", label: "Visible on site", type: "switch", initialValue: true },
    ]}
  />
);

/* --------------------------------- Stats --------------------------------- */

const STAT_GROUPS = [
  { value: "home-stats", label: "Homepage counters" },
  { value: "values", label: "Company values" },
  { value: "why-choose", label: "Why choose us" },
  { value: "drivers", label: "What drives us" },
  { value: "industries", label: "Industries" },
];

export const StatsPage = () => (
  <ResourceManager
    resource="stats"
    title="Stats & value props"
    subtitle="Homepage counters, values, differentiators and the industries list"
    searchPlaceholder="Search"
    columns={[
      orderColumn,
      {
        title: "Label / title",
        render: (_: unknown, row: any) => row.title || row.label,
      },
      {
        title: "Value",
        width: 110,
        render: (_: unknown, row: any) =>
          row.value ? `${row.value}${row.suffix ?? ""}` : "—",
      },
      {
        title: "Group",
        dataIndex: "group",
        width: 160,
        render: (v: string) => <Tag>{v}</Tag>,
      },
      activeColumn,
    ]}
    fields={[
      { name: "label", label: "Label", type: "text", help: "Counters and industries" },
      { name: "title", label: "Title", type: "text", help: "Value / differentiator cards" },
      { name: "value", label: "Value", type: "text", placeholder: "120" },
      { name: "suffix", label: "Suffix", type: "text", placeholder: "+" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
      {
        name: "group",
        label: "Group",
        type: "select",
        options: STAT_GROUPS,
        initialValue: "home-stats",
        required: true,
      },
      { name: "order", label: "Order", type: "number", initialValue: 99 },
      { name: "isActive", label: "Visible on site", type: "switch", initialValue: true },
    ]}
  />
);
