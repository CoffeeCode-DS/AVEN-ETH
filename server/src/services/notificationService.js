import { db } from "../data/store.js";
import { nextId, nowIso } from "../utils/simulate.js";

export function notify(userId, { type, title, message, agreementId }) {
  return db.notifications.insert({
    id: nextId("notif"),
    userId,
    type,
    title,
    message,
    agreementId: agreementId || null,
    read: false,
    createdAt: nowIso(),
  });
}
