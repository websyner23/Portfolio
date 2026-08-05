import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { revalidateFrontend } from "../../utils/revalidate";
import sendResponse from "../../utils/sendResponse";
import { recordAudit } from "../auditLog/auditLog.utils";
import { Section, SiteSettings, ThemeSettings } from "./cms.model";

const SINGLETON_KEY = "default";

/** Returns the singleton, creating it with schema defaults on first access. */
const getSingleton = async <T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any
): Promise<T> => {
  const existing = await model.findOne({ key: SINGLETON_KEY });
  if (existing) return existing;
  return model.create({ key: SINGLETON_KEY });
};

const getSiteSettings = catchAsync(async (req, res) => {
  const data = await getSingleton(SiteSettings);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Site settings retrieved",
    data,
  });
});

const updateSiteSettings = catchAsync(async (req, res) => {
  const data = await SiteSettings.findOneAndUpdate(
    { key: SINGLETON_KEY },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );

  recordAudit(req, {
    user: req.user._id,
    action: "cms.update",
    module: "cms",
    description: "Updated site settings",
    meta: { changes: Object.keys(req.body ?? {}) },
  });
  revalidateFrontend(["site", "sections"]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Site settings updated",
    data,
  });
});

const getTheme = catchAsync(async (req, res) => {
  const data = await getSingleton(ThemeSettings);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Theme retrieved",
    data,
  });
});

const updateTheme = catchAsync(async (req, res) => {
  const data = await ThemeSettings.findOneAndUpdate(
    { key: SINGLETON_KEY },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true }
  );

  recordAudit(req, {
    user: req.user._id,
    action: "cms.theme",
    module: "cms",
    description: "Updated theme colours",
    meta: { changes: Object.keys(req.body ?? {}) },
  });
  revalidateFrontend(["site", "theme"]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Theme updated",
    data,
  });
});

const getSections = catchAsync(async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (req.query.page) filter.page = req.query.page;

  const data = await Section.find(filter).sort("page order");

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Sections retrieved",
    data,
  });
});

const updateSection = catchAsync(async (req, res) => {
  const { page, sectionKey } = req.params;

  const data = await Section.findOneAndUpdate(
    { page, sectionKey },
    { $set: { ...req.body, page, sectionKey } },
    { new: true, upsert: true, runValidators: true }
  );

  recordAudit(req, {
    user: req.user._id,
    action: "cms.section",
    module: "cms",
    targetId: `${page}/${sectionKey}`,
    description: `Updated "${sectionKey}" section on the ${page} page`,
  });
  revalidateFrontend(["sections"]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Section updated",
    data,
  });
});

export const CmsController = {
  getSiteSettings,
  updateSiteSettings,
  getTheme,
  updateTheme,
  getSections,
  updateSection,
};
