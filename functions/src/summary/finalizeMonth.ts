import * as functions from "firebase-functions/v1";
import {assertString, db, requireUid, serverTimestamp} from "../shared/firebase";
import {requireAdmin} from "../shared/validators";
import {recalculateMonth} from "./recalculate";

export const finalizeMonth = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  const month = assertString(data.month, "month", 7);
  if (!/^\d{4}-\d{2}$/.test(month)) throw new functions.https.HttpsError("invalid-argument", "month must use YYYY-MM.");
  await requireAdmin(groupId, uid);
  const summaryRef = db.doc(`groups/${groupId}/monthlySummary/${month}`);
  await db.runTransaction(async transaction => {
    const summary = await transaction.get(summaryRef);
    if (summary.data()?.finalized === true) throw new functions.https.HttpsError("already-exists", "This month is already finalized.");
    transaction.set(summaryRef, {closing: true}, {merge: true});
  });
  try {
    await recalculateMonth(groupId, month, true);
    await summaryRef.set({closing: false, finalized: true, finalizedAt: serverTimestamp(), finalizedBy: uid}, {merge: true});
  } catch (error) {
    await summaryRef.set({closing: false}, {merge: true});
    throw error;
  }
  return {success: true};
});
