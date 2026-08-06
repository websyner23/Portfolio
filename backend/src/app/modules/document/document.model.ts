import { model, Schema } from "mongoose";

export const DOCUMENT_TYPES = [
  "offer",
  "appointment",
  "promotion",
  "resignation-acceptance",
  "experience",
  "noc",
  "warning",
  "custom",
] as const;

/**
 * A reusable letter with {{placeholders}}. `variables` is derived from the
 * body on save, so the generator UI always offers the right fields.
 */
const documentTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: DOCUMENT_TYPES, default: "custom", index: true },
    description: { type: String, default: "" },
    contentHtml: { type: String, required: true },
    variables: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const DocumentTemplate = model("DocumentTemplate", documentTemplateSchema);

/** An issued letter — the rendered HTML is kept so it never changes later. */
const generatedDocumentSchema = new Schema(
  {
    template: { type: Schema.Types.ObjectId, ref: "DocumentTemplate" },
    templateName: { type: String, default: "" },
    type: { type: String, enum: DOCUMENT_TYPES, default: "custom", index: true },
    title: { type: String, required: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee" },
    recipientName: { type: String, default: "" },
    variableValues: { type: Schema.Types.Mixed, default: {} },
    renderedHtml: { type: String, required: true },
    reference: { type: String, unique: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
    issuedAt: { type: Date, default: Date.now },
    fileUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

generatedDocumentSchema.index({ createdAt: -1 });

export const GeneratedDocument = model(
  "GeneratedDocument",
  generatedDocumentSchema
);
