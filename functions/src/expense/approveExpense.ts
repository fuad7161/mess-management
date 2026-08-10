import * as functions from "firebase-functions/v1";
import {assertString, db, requireUid, serverTimestamp} from "../shared/firebase";
import {requireAdmin} from "../shared/validators";

export const approveExpense = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  const expenseId = assertString(data.expenseId, "expenseId", 128);
  const entryType = data.entryType;
  if (entryType !== "bazar" && entryType !== "extraCost" && entryType !== "payment") throw new functions.https.HttpsError("invalid-argument", "Invalid entry type.");
  const normalizedDecision = data.decision === "approve" || data.decision === "approved" ? "approved" : data.decision === "reject" || data.decision === "rejected" ? "rejected" : null;
  if (!normalizedDecision) throw new functions.https.HttpsError("invalid-argument", "Invalid decision.");
  await requireAdmin(groupId, uid);
  const collectionName = entryType === "payment" ? "payments" : "expenses";
  const ref = db.doc(`groups/${groupId}/${collectionName}/${expenseId}`);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new functions.https.HttpsError("not-found", "Entry not found.");
    if (snapshot.data()?.submittedBy === uid) throw new functions.https.HttpsError("permission-denied", "You cannot verify your own entry.");
    const summary = await transaction.get(db.doc(`groups/${groupId}/monthlySummary/${snapshot.data()!.date.slice(0, 7)}`));
    if (summary.data()?.finalized === true || summary.data()?.closing === true) throw new functions.https.HttpsError("failed-precondition", "This month is finalized or being finalized.");
    transaction.update(ref, {status: normalizedDecision, approvedBy: uid, approvedAt: serverTimestamp()});
  });
  return {success: true};
});
