import { Router } from "express";
import auth from "../../middlewares/auth";
import { createCrudController } from "../../utils/crudFactory";
import { revalidateFrontend } from "../../utils/revalidate";
import { CmsController } from "./cms.controller";
import {
  CompareRow,
  Faq,
  Portfolio,
  PortfolioCategory,
  PricingExtra,
  PricingPlan,
  ProcessStep,
  Service,
  Stat,
  TeamMember,
  Testimonial,
} from "./cms.model";

const router = Router();
const CMS = "cms.manage";

/* ---------------- Singletons & sections ---------------- */

router.get("/site-settings", auth(CMS), CmsController.getSiteSettings);
router.patch("/site-settings", auth(CMS), CmsController.updateSiteSettings);

router.get("/theme", auth(CMS), CmsController.getTheme);
router.patch("/theme", auth(CMS), CmsController.updateTheme);

router.get("/sections", auth(CMS), CmsController.getSections);
router.patch("/sections/:page/:sectionKey", auth(CMS), CmsController.updateSection);

/* ---------------- Typed content collections ---------------- */

type TResource = {
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  label: string;
  searchableFields: string[];
  tag: string;
  populate?: string;
  displayField?: string;
};

const resources: TResource[] = [
  {
    path: "/services",
    model: Service,
    label: "Service",
    searchableFields: ["title", "slug", "short", "summary"],
    tag: "services",
  },
  {
    path: "/portfolio-categories",
    model: PortfolioCategory,
    label: "Portfolio category",
    searchableFields: ["name", "slug"],
    tag: "portfolio",
    displayField: "name",
  },
  {
    path: "/portfolio",
    model: Portfolio,
    label: "Portfolio item",
    searchableFields: ["title", "client", "slug", "summary", "tags"],
    tag: "portfolio",
    populate: "category",
  },
  {
    path: "/testimonials",
    model: Testimonial,
    label: "Testimonial",
    searchableFields: ["name", "company", "quote"],
    tag: "testimonials",
    displayField: "name",
  },
  {
    path: "/team",
    model: TeamMember,
    label: "Team member",
    searchableFields: ["name", "role"],
    tag: "team",
    displayField: "name",
  },
  {
    path: "/pricing-plans",
    model: PricingPlan,
    label: "Pricing plan",
    searchableFields: ["name", "description"],
    tag: "pricing",
    displayField: "name",
  },
  {
    path: "/pricing-extras",
    model: PricingExtra,
    label: "Pricing extra",
    searchableFields: ["name", "description"],
    tag: "pricing",
    displayField: "name",
  },
  {
    path: "/compare-rows",
    model: CompareRow,
    label: "Comparison row",
    searchableFields: ["feature"],
    tag: "pricing",
    displayField: "feature",
  },
  {
    path: "/faqs",
    model: Faq,
    label: "FAQ",
    searchableFields: ["q", "a"],
    tag: "faqs",
    displayField: "q",
  },
  {
    path: "/process-steps",
    model: ProcessStep,
    label: "Process step",
    searchableFields: ["title", "description"],
    tag: "process",
  },
  {
    path: "/stats",
    model: Stat,
    label: "Stat",
    searchableFields: ["label", "description"],
    tag: "stats",
    displayField: "label",
  },
];

resources.forEach((resource) => {
  const controller = createCrudController({
    model: resource.model,
    label: resource.label,
    auditModule: "cms",
    searchableFields: resource.searchableFields,
    displayField: resource.displayField,
    populate: resource.populate,
    onMutate: () => revalidateFrontend([resource.tag]),
  });

  router.get(resource.path, auth(CMS), controller.getAll);
  router.post(resource.path, auth(CMS), controller.create);
  router.patch(`${resource.path}/reorder`, auth(CMS), controller.reorder);
  router.get(`${resource.path}/:id`, auth(CMS), controller.getOne);
  router.patch(`${resource.path}/:id`, auth(CMS), controller.update);
  router.delete(`${resource.path}/:id`, auth(CMS), controller.remove);
});

export const CmsRoutes = router;
