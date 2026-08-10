import * as functions from "firebase-functions/v1";
import {assertString, db, requireUid, serverTimestamp} from "../shared/firebase";
import {assertDate, assertOpenMonth, getActiveMember} from "../shared/validators";

export const submitExpense = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  const type = data.type;
  if (type !== "bazar" && type !== "extraCost" && type !== "payment") throw new functions.https.HttpsError("invalid-argument", "Invalid entry type.");
  const amount = data.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 10000000) throw new functions.https.HttpsError("invalid-argument", "Invalid amount.");
  const date = assertDate(data.date);
  await Promise.all([getActiveMember(groupId, uid), assertOpenMonth(groupId, date)]);
  const collectionName = type === "payment" ? "payments" : "expenses";
  const ref = db.collection(`groups/${groupId}/${collectionName}`).doc();
  const common = {
    submittedBy: uid, amount, date,
    note: typeof data.note === "string" ? data.note.trim().slice(0, 500) || null : null,
    status: "pending", approvedBy: null, approvedAt: null, createdAt: serverTimestamp(),
  };
  await db.runTransaction(async transaction => {
    const [group, summary] = await Promise.all([
      transaction.get(db.doc(`groups/${groupId}`)),
      transaction.get(db.doc(`groups/${groupId}/monthlySummary/${date.slice(0, 7)}`)),
    ]);
    if (!group.exists || group.data()?.status !== "active" || group.data()!.adminCount < 2) throw new functions.https.HttpsError("failed-precondition", "At least two admins are required before financial entries can be created.");
    if (summary.data()?.finalized === true || summary.data()?.closing === true) throw new functions.https.HttpsError("failed-precondition", "This month is finalized or being finalized.");
    transaction.set(ref, type === "payment" ? {...common, method: typeof data.method === "string" ? data.method.trim().slice(0, 50) || null : null} : {
      ...common, type, receiptUrl: typeof data.receiptUrl === "string" ? data.receiptUrl.slice(0, 1000) : null,
    });
  });
  return {expenseId: ref.id};
});
