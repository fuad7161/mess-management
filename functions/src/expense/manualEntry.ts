import * as functions from "firebase-functions/v1";
import {assertString, db, requireUid, serverTimestamp} from "../shared/firebase";
import {assertDate, assertOpenMonth, requireAdmin} from "../shared/validators";

export const manualExpenseEntry = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  const onBehalfOfUid = assertString(data.onBehalfOfUid, "onBehalfOfUid", 128);
  await requireAdmin(groupId, uid);
  if (onBehalfOfUid === uid) throw new functions.https.HttpsError("permission-denied", "Manual entries for yourself must be verified by another admin.");
  const type = data.type;
  if (type !== "bazar" && type !== "extraCost" && type !== "payment") throw new functions.https.HttpsError("invalid-argument", "Invalid entry type.");
  if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount <= 0 || data.amount > 10000000) throw new functions.https.HttpsError("invalid-argument", "Invalid amount.");
  const date = assertDate(data.date);
  await assertOpenMonth(groupId, date);
  const collectionName = type === "payment" ? "payments" : "expenses";
  const ref = db.collection(`groups/${groupId}/${collectionName}`).doc();
  const common = {submittedBy: onBehalfOfUid, enteredByAdmin: uid, amount: data.amount, date, note: typeof data.note === "string" ? data.note.trim().slice(0, 500) || null : null, status: "approved", approvedBy: uid, approvedAt: serverTimestamp(), createdAt: serverTimestamp()};
  await db.runTransaction(async transaction => {
    const [group, summary] = await Promise.all([
      transaction.get(db.doc(`groups/${groupId}`)),
      transaction.get(db.doc(`groups/${groupId}/monthlySummary/${date.slice(0, 7)}`)),
    ]);
    if (group.data()?.adminCount < 2 || group.data()?.status !== "active") throw new functions.https.HttpsError("failed-precondition", "At least two admins are required.");
    if (summary.data()?.finalized === true || summary.data()?.closing === true) throw new functions.https.HttpsError("failed-precondition", "This month is finalized or being finalized.");
    transaction.set(ref, type === "payment" ? {...common, method: typeof data.method === "string" ? data.method.slice(0, 50) : null} : {...common, type, receiptUrl: typeof data.receiptUrl === "string" ? data.receiptUrl.slice(0, 1000) : null});
  });
  return {expenseId: ref.id};
});
