import { model, Schema } from "mongoose";

/**
 * Broadcast notifications for the admin panel. Read state is tracked per user
 * in `readBy` rather than one document per recipient — the admin team is small
 * and this keeps the bell query to a single lookup.
 */
const notificationSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      // lead.new | meeting.new | meeting.upcoming | attendance.absent | chat.message | system
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    entity: {
      kind: { type: String },
      id: { type: String },
    },
    link: { type: String, default: "" },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

export const Notification = model("Notification", notificationSchema);
