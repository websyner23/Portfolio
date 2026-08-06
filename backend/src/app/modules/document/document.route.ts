import { Router } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { recordAudit } from "../auditLog/auditLog.utils";
import {
  DOCUMENT_TYPES,
  DocumentTemplate,
  GeneratedDocument,
} from "./document.model";
import { DocumentService } from "./document.service";
import { extractVariables, humanizeVariable } from "./document.utils";

const router = Router();
const MANAGE = "documents.manage";

const templateSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(2).max(120),
    type: z.enum(DOCUMENT_TYPES).optional(),
    description: z.string().max(500).optional().or(z.literal("")),
    contentHtml: z
      .string({ required_error: "The letter body is required" })
      .min(20, "The letter looks too short"),
    isActive: z.boolean().optional(),
  }),
});

/* ------------------------------- Templates ------------------------------- */

router.get(
  "/templates",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const qb = new QueryBuilder(DocumentTemplate.find(), {
      limit: 100,
      sort: "name",
      ...req.query,
    })
      .search(["name", "description"])
      .filter()
      .sort()
      .paginate();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Templates retrieved",
      meta,
      data,
    });
  })
);

router.post(
  "/templates",
  auth(MANAGE),
  validateRequest(templateSchema),
  catchAsync(async (req, res) => {
    const template = await DocumentService.createTemplate(req.body, req.user._id);

    recordAudit(req, {
      user: req.user._id,
      action: "document.template.create",
      module: "documents",
      targetId: String(template._id),
      description: `Created the "${template.name}" template`,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Template created",
      data: template,
    });
  })
);

router.get(
  "/templates/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const template = await DocumentTemplate.findById(req.params.id);
    if (!template) throw new AppError(httpStatus.NOT_FOUND, "Template not found");

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Template retrieved",
      data: template,
    });
  })
);

router.patch(
  "/templates/:id",
  auth(MANAGE),
  validateRequest(z.object({ body: templateSchema.shape.body.partial() })),
  catchAsync(async (req, res) => {
    const template = await DocumentService.updateTemplate(req.params.id, req.body);

    recordAudit(req, {
      user: req.user._id,
      action: "document.template.update",
      module: "documents",
      targetId: req.params.id,
      description: `Updated the "${template.name}" template`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Template updated",
      data: template,
    });
  })
);

router.delete(
  "/templates/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const template = await DocumentTemplate.findByIdAndDelete(req.params.id);
    if (!template) throw new AppError(httpStatus.NOT_FOUND, "Template not found");

    recordAudit(req, {
      user: req.user._id,
      action: "document.template.delete",
      module: "documents",
      targetId: req.params.id,
      description: `Deleted the "${template.name}" template`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Template deleted — letters already issued are unaffected",
    });
  })
);

/** Placeholders the generator fills automatically, for the editor's helper UI. */
router.get(
  "/placeholders",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const values = await DocumentService.getAutoFillFor(
      req.query.employee as string | undefined
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Placeholders retrieved",
      data: Object.keys(values).map((key) => ({
        key,
        label: humanizeVariable(key),
        sample: values[key],
      })),
    });
  })
);

/* ------------------------------- Generation ------------------------------- */

const generateSchema = z.object({
  body: z.object({
    template: z.string({ required_error: "Pick a template" }),
    employee: z.string().optional(),
    values: z.record(z.string()).optional(),
    title: z.string().max(200).optional(),
  }),
});

router.post(
  "/preview",
  auth(MANAGE),
  validateRequest(generateSchema),
  catchAsync(async (req, res) => {
    const result = await DocumentService.preview(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Preview generated",
      data: {
        renderedHtml: result.renderedHtml,
        values: result.values,
        variables: result.template.variables,
      },
    });
  })
);

router.post(
  "/generate",
  auth(MANAGE),
  validateRequest(generateSchema),
  catchAsync(async (req, res) => {
    const document = await DocumentService.generate(req.body, req.user._id);

    recordAudit(req, {
      user: req.user._id,
      action: "document.generate",
      module: "documents",
      targetId: String(document._id),
      description: `Issued "${document.title}" (${document.reference})`,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Document issued",
      data: document,
    });
  })
);

/* -------------------------------- History -------------------------------- */

router.get(
  "/generated",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const qb = new QueryBuilder(
      GeneratedDocument.find()
        .populate("employee", "employeeId fullName")
        .populate("issuedBy", "name")
        .select("-renderedHtml"),
      { limit: 30, sort: "-createdAt", ...req.query }
    )
      .search(["title", "recipientName", "reference"])
      .filter()
      .sort()
      .paginate();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Issued documents retrieved",
      meta,
      data,
    });
  })
);

router.get(
  "/generated/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const document = await GeneratedDocument.findById(req.params.id)
      .populate("employee", "employeeId fullName")
      .populate("issuedBy", "name");
    if (!document) throw new AppError(httpStatus.NOT_FOUND, "Document not found");

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Document retrieved",
      data: document,
    });
  })
);

router.delete(
  "/generated/:id",
  auth(MANAGE),
  catchAsync(async (req, res) => {
    const document = await GeneratedDocument.findByIdAndDelete(req.params.id);
    if (!document) throw new AppError(httpStatus.NOT_FOUND, "Document not found");

    recordAudit(req, {
      user: req.user._id,
      action: "document.delete",
      module: "documents",
      targetId: req.params.id,
      description: `Deleted the issued document ${document.reference}`,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Document deleted",
    });
  })
);

export const DocumentRoutes = router;
