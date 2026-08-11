import { Request, Response } from "express";
import httpStatus from "http-status";
import { Model } from "mongoose";
import QueryBuilder from "../builder/QueryBuilder";
import AppError from "../errors/AppError";
import { recordAudit } from "../modules/auditLog/auditLog.utils";
import catchAsync from "./catchAsync";
import sendResponse from "./sendResponse";

type TCrudOptions<T> = {
  /** Mongoose model to operate on. */
  model: Model<T>;
  /** Human label used in messages and audit entries, e.g. "Service". */
  label: string;
  /** Audit module name, e.g. "cms". */
  auditModule: string;
  /** Fields the ?searchTerm= query searches across. */
  searchableFields?: string[];
  /** Default sort applied when the request doesn't specify one. */
  defaultSort?: string;
  /** Field used in audit descriptions (defaults to "title" then "name"). */
  displayField?: string;
  /** Optional populate spec applied to list/read queries. */
  populate?: string | string[];
  /** Called after any create/update/delete — used to trigger frontend revalidation. */
  onMutate?: (
    action: "create" | "update" | "delete",
    doc: unknown
  ) => void;
};

/**
 * Builds a standard REST controller set for content collections. Every CMS
 * resource shares the same list/read/create/update/delete semantics, so they
 * are generated here instead of being copy-pasted per module.
 */
export const createCrudController = <T>(options: TCrudOptions<T>) => {
  const {
    model,
    label,
    auditModule,
    searchableFields = [],
    defaultSort = "order createdAt",
    displayField,
    populate,
    onMutate,
  } = options;

  const describe = (doc: unknown): string => {
    if (!doc) return label;
    const record = doc as Record<string, unknown>;
    const field =
      displayField ??
      (record.title !== undefined
        ? "title"
        : record.name !== undefined
          ? "name"
          : "_id");
    return String(record[field] ?? record._id);
  };

  const applyPopulate = <Q extends { populate: (p: string) => Q }>(query: Q): Q => {
    if (!populate) return query;
    const list = Array.isArray(populate) ? populate : [populate];
    return list.reduce((q, p) => q.populate(p), query);
  };

  const getAll = catchAsync(async (req: Request, res: Response) => {
    const query = { ...req.query };
    if (!query.sort) query.sort = defaultSort;

    const qb = new QueryBuilder(applyPopulate(model.find()), query)
      .search(searchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const data = await qb.modelQuery;
    const meta = await qb.countTotal();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `${label} list retrieved`,
      meta,
      data,
    });
  });

  const getOne = catchAsync(async (req: Request, res: Response) => {
    const doc = await applyPopulate(model.findById(req.params.id));
    if (!doc) throw new AppError(httpStatus.NOT_FOUND, `${label} not found`);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `${label} retrieved`,
      data: doc,
    });
  });

  const create = catchAsync(async (req: Request, res: Response) => {
    const doc = await model.create(req.body);

    recordAudit(req, {
      user: req.user?._id,
      action: `${auditModule}.create`,
      module: auditModule,
      targetId: String((doc as { _id: unknown })._id),
      description: `Created ${label.toLowerCase()} "${describe(doc)}"`,
    });
    onMutate?.("create", doc);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: `${label} created`,
      data: doc,
    });
  });

  const update = catchAsync(async (req: Request, res: Response) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw new AppError(httpStatus.NOT_FOUND, `${label} not found`);

    recordAudit(req, {
      user: req.user?._id,
      action: `${auditModule}.update`,
      module: auditModule,
      targetId: req.params.id,
      description: `Updated ${label.toLowerCase()} "${describe(doc)}"`,
      meta: { changes: Object.keys(req.body ?? {}) },
    });
    onMutate?.("update", doc);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `${label} updated`,
      data: doc,
    });
  });

  const remove = catchAsync(async (req: Request, res: Response) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) throw new AppError(httpStatus.NOT_FOUND, `${label} not found`);

    recordAudit(req, {
      user: req.user?._id,
      action: `${auditModule}.delete`,
      module: auditModule,
      targetId: req.params.id,
      description: `Deleted ${label.toLowerCase()} "${describe(doc)}"`,
    });
    onMutate?.("delete", doc);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `${label} deleted`,
    });
  });

  /** Bulk reorder: [{ _id, order }, …] — used by drag-and-drop admin tables. */
  const reorder = catchAsync(async (req: Request, res: Response) => {
    const items = (req.body?.items ?? []) as { _id: string; order: number }[];

    await Promise.all(
      items.map((item) =>
        model.findByIdAndUpdate(item._id, { order: item.order })
      )
    );

    recordAudit(req, {
      user: req.user?._id,
      action: `${auditModule}.reorder`,
      module: auditModule,
      description: `Reordered ${items.length} ${label.toLowerCase()} item(s)`,
    });
    onMutate?.("update", null);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: `${label} order updated`,
    });
  });

  return { getAll, getOne, create, update, remove, reorder };
};
