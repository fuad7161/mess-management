import * as functions from "firebase-functions/v1";
import {db, serverTimestamp} from "../shared/firebase";
import {calculateBreakdown} from "../shared/calculations";

const amountByMember = (docs: FirebaseFirestore.QueryDocumentSnapshot[]) => {
  const values: Record<string, number> = {};
  docs.forEach(doc => {
    const data = doc.data();
    values[data.submittedBy] = (values[data.submittedBy] ?? 0) + Number(data.amount ?? 0);
  });
  return values;
};

export const recalculateMonth = async (groupId: string, month: string, force = false) => {
  if (!/^\d{4}-\d{2}$/.test(month)) return;
  const summaryRef = db.doc(`groups/${groupId}/monthlySummary/${month}`);
  const existing = await summaryRef.get();
  if (!force && (existing.data()?.finalized === true || existing.data()?.closing === true)) return;
  const start = `${month}-01`;
  const end = `${month}-31`;
  const [meals, bazar, extra, payments, members, group] = await Promise.all([
    db.collection(`groups/${groupId}/meals`).where("date", ">=", start).where("date", "<=", end).get(),
    db.collection(`groups/${groupId}/expenses`).where("type", "==", "bazar").where("status", "==", "approved").where("date", ">=", start).where("date", "<=", end).get(),
    db.collection(`groups/${groupId}/expenses`).where("type", "==", "extraCost").where("status", "==", "approved").where("date", ">=", start).where("date", "<=", end).get(),
    db.collection(`groups/${groupId}/payments`).where("status", "==", "approved").where("date", ">=", start).where("date", "<=", end).get(),
    db.collection(`groups/${groupId}/members`).get(),
    db.doc(`groups/${groupId}`).get(),
  ]);
  const mealTotals: Record<string, number> = {};
  meals.docs.forEach(doc => {
    const data = doc.data();
    const weights = data.weightsUsedSnapshot ?? group.data()?.mealWeights ?? {breakfast: 0.5, lunch: 1, dinner: 1};
    const units = (data.breakfast ? Number(weights.breakfast) : 0) + (data.lunch ? Number(weights.lunch) : 0) + (data.dinner ? Number(weights.dinner) : 0) + Number(data.guestMeals ?? 0);
    mealTotals[data.uid] = (mealTotals[data.uid] ?? 0) + units;
  });
  const totalBazar = bazar.docs.reduce((sum, doc) => sum + Number(doc.data().amount ?? 0), 0);
  const totalExtraCost = extra.docs.reduce((sum, doc) => sum + Number(doc.data().amount ?? 0), 0);
  const totalPayments = payments.docs.reduce((sum, doc) => sum + Number(doc.data().amount ?? 0), 0);
  const [year, monthNumber] = month.split("-").map(Number);
  const monthStart = Date.UTC(year, monthNumber - 1, 1);
  const monthEnd = Date.UTC(year, monthNumber, 1) - 1;
  const memberIds = members.docs.filter(doc => {
    const data = doc.data();
    const joined = data.joinedAt?.toMillis?.() ?? 0;
    const left = data.leftAt?.toMillis?.() ?? Number.POSITIVE_INFINITY;
    return joined <= monthEnd && left >= monthStart;
  }).map(doc => doc.id);
  const calculated = calculateBreakdown(mealTotals, amountByMember(payments.docs), totalBazar, totalExtraCost, memberIds);
  await summaryRef.set({
    totalBazar, totalExtraCost, totalPayments, ...calculated,
    memberCountForExtraCost: memberIds.length,
    mealWeightsSnapshot: group.data()?.mealWeights ?? {breakfast: 0.5, lunch: 1, dinner: 1},
    finalized: false, updatedAt: serverTimestamp(),
  }, {merge: true});
};

export const monthsFromChange = (change: functions.Change<FirebaseFirestore.DocumentSnapshot>) => {
  const months = new Set<string>();
  const before = change.before.data()?.date;
  const after = change.after.data()?.date;
  if (typeof before === "string") months.add(before.slice(0, 7));
  if (typeof after === "string") months.add(after.slice(0, 7));
  return [...months];
};
