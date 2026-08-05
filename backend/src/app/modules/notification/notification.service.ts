import { notifyAdmins } from "../../../socket";
import { Notification } from "./notification.model";

type TCreateNotification = {
  type: string;
  title: string;
  body?: string;
  link?: string;
  entity?: { kind: string; id: string };
};

/**
 * Persists a notification and pushes it to every connected admin. Failures are
 * swallowed: a notification must never break the request that triggered it.
 */
export const pushNotification = async (payload: TCreateNotification) => {
  try {
    const doc = await Notification.create(payload);
    notifyAdmins(payload.type, {
      _id: String(doc._id),
      type: doc.type,
      title: doc.title,
      body: doc.body,
      link: doc.link,
      entity: doc.entity,
      createdAt: doc.createdAt,
    });
    return doc;
  } catch (err) {
    console.error("[notification] failed:", (err as Error).message);
    return null;
  }
};
