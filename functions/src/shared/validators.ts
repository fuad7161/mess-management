import * as functions from "firebase-functions/v1";
import {db} from "./firebase";

export const getActiveMember = async (groupId: string, uid: string) => {
  const snapshot = await db.doc(`groups/${groupId}/members/${uid}`).get();
  if (!snapshot.exists || snapshot.data()?.active !== true) {
    throw new functions.https.HttpsError("permission-denied", "You are not an active group member.");
  }
  return snapshot.data()!;
};

export const requireAdmin = async (groupId: string, uid: string) => {
  const member = await getActiveMember(groupId, uid);
  if (member.role !== "admin") throw new functions.https.HttpsError("permission-denied", "Admin access is required.");
  return member;
};

export const assertDate = (date: unknown) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new functions.https.HttpsError("invalid-argument", "date must use YYYY-MM-DD.");
  }
  return date;
};

export const assertOpenMonth = async (groupId: string, date: string) => {
  const summary = await db.doc(`groups/${groupId}/monthlySummary/${date.slice(0, 7)}`).get();
  if (summary.data()?.finalized === true || summary.data()?.closing === true) throw new functions.https.HttpsError("failed-precondition", "This month is finalized or being finalized.");
};
