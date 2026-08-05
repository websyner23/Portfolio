import { Router } from "express";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import validateRequest from "../../middlewares/validateRequest";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { LeadController } from "../lead/lead.controller";
import { LeadValidation } from "../lead/lead.validation";
import { MeetingService } from "../meeting/meeting.service";
import { MeetingValidation } from "../meeting/meeting.validation";
import {
  CompareRow,
  Faq,
  Portfolio,
  PortfolioCategory,
  PricingExtra,
  PricingPlan,
  ProcessStep,
  Section,
  Service,
  SiteSettings,
  Stat,
  TeamMember,
  Testimonial,
  ThemeSettings,
} from "../cms/cms.model";

const router = Router();

/**
 * Public, unauthenticated read API consumed by the Next.js frontend.
 * Everything here is cached by the frontend with tag-based revalidation.
 */

/** One call for the root layout: brand, nav, socials, contact and theme. */
router.get(
  "/site",
  catchAsync(async (req, res) => {
    const [settings, theme] = await Promise.all([
      SiteSettings.findOne({ key: "default" }),
      ThemeSettings.findOne({ key: "default" }),
    ]);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Site data retrieved",
      data: { settings, theme },
    });
  })
);

router.get(
  "/sections",
  catchAsync(async (req, res) => {
    const filter: Record<string, unknown> = { visible: true };
    if (req.query.page) filter.page = req.query.page;

    const sections = await Section.find(filter).sort("order");

    // Keyed by sectionKey so pages can look up content directly.
    const data = sections.reduce<Record<string, unknown>>((acc, section) => {
      acc[section.sectionKey] = section.content;
      return acc;
    }, {});

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Sections retrieved",
      data,
    });
  })
);

router.get(
  "/services",
  catchAsync(async (req, res) => {
    const data = await Service.find({ isActive: true }).sort("order");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Services retrieved",
      data,
    });
  })
);

router.get(
  "/services/:slug",
  catchAsync(async (req, res) => {
    const data = await Service.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!data) throw new AppError(httpStatus.NOT_FOUND, "Service not found");

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Service retrieved",
      data,
    });
  })
);

router.get(
  "/portfolio-categories",
  catchAsync(async (req, res) => {
    const data = await PortfolioCategory.find().sort("order name");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Portfolio categories retrieved",
      data,
    });
  })
);

/** Supports ?category=<slug>&searchTerm=&tag=&page=&limit= for the grid filters. */
router.get(
  "/portfolio",
  catchAsync(async (req, res) => {
    const query: Record<string, unknown> = { ...req.query, isPublished: true };

    // Filter by category slug rather than exposing ObjectIds to the frontend.
    if (query.category) {
      const category = await PortfolioCategory.findOne({ slug: query.category });
      if (!category) {
        sendResponse(res, {
          statusCode: httpStatus.OK,
          message: "Portfolio retrieved",
          meta: { page: 1, limit: 0, total: 0, totalPage: 0 },
          data: [],
        });
        return;
      }
      query.category = category._id;
    }

    if (query.tag) {
      query.tags = query.tag;
      delete query.tag;
    }

    if (!query.sort) query.sort = "order -year";
    if (!query.limit) query.limit = 100;

    const qb = new QueryBuilder(Portfolio.find().populate("category"), query)
      .search(["title", "client", "summary", "tags"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Portfolio retrieved",
      meta,
      data,
    });
  })
);

router.get(
  "/portfolio/:slug",
  catchAsync(async (req, res) => {
    const item = await Portfolio.findOne({
      slug: req.params.slug,
      isPublished: true,
    }).populate("category");
    if (!item) throw new AppError(httpStatus.NOT_FOUND, "Project not found");

    // Neighbours power the prev/next links on the detail page.
    const [prev, next] = await Promise.all([
      Portfolio.findOne({ isPublished: true, order: { $lt: item.order } })
        .sort("-order")
        .select("slug title"),
      Portfolio.findOne({ isPublished: true, order: { $gt: item.order } })
        .sort("order")
        .select("slug title"),
    ]);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Project retrieved",
      data: { item, prev, next },
    });
  })
);

router.get(
  "/testimonials",
  catchAsync(async (req, res) => {
    const data = await Testimonial.find({ isActive: true }).sort("order");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Testimonials retrieved",
      data,
    });
  })
);

router.get(
  "/team",
  catchAsync(async (req, res) => {
    const data = await TeamMember.find({ isActive: true }).sort("order");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Team retrieved",
      data,
    });
  })
);

router.get(
  "/pricing",
  catchAsync(async (req, res) => {
    const [plans, extras, compareRows] = await Promise.all([
      PricingPlan.find({ isActive: true }).sort("order"),
      PricingExtra.find({ isActive: true }).sort("order"),
      CompareRow.find().sort("order"),
    ]);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Pricing retrieved",
      data: { plans, extras, compareRows },
    });
  })
);

router.get(
  "/faqs",
  catchAsync(async (req, res) => {
    const filter: Record<string, unknown> = { isActive: true };
    if (req.query.group) filter.group = req.query.group;

    const data = await Faq.find(filter).sort("order");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "FAQs retrieved",
      data,
    });
  })
);

router.get(
  "/process",
  catchAsync(async (req, res) => {
    const data = await ProcessStep.find({ isActive: true }).sort("group order");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Process retrieved",
      data,
    });
  })
);

router.get(
  "/stats",
  catchAsync(async (req, res) => {
    const data = await Stat.find({ isActive: true }).sort("group order");
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Stats retrieved",
      data,
    });
  })
);

/* ------------------------------------------------------------------ *
 * Public write endpoints — the website's forms post here (no auth).
 * ------------------------------------------------------------------ */

router.post(
  "/leads",
  validateRequest(LeadValidation.createLeadSchema),
  LeadController.createLead
);

router.get(
  "/meetings/availability",
  catchAsync(async (req, res) => {
    const data = await MeetingService.getAvailability(
      req.query.month as string | undefined
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Availability retrieved",
      data,
    });
  })
);

router.post(
  "/meetings",
  validateRequest(MeetingValidation.bookMeetingSchema),
  catchAsync(async (req, res) => {
    const meeting = await MeetingService.bookMeeting(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message:
        "Booking received — check your inbox, we'll confirm the slot shortly.",
      data: {
        _id: meeting._id,
        date: meeting.date,
        time: meeting.time,
        timezone: meeting.timezone,
        durationMins: meeting.durationMins,
      },
    });
  })
);

export const PublicRoutes = router;
