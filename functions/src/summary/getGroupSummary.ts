import * as functions from "firebase-functions/v1";
import {assertString, db, requireUid} from "../shared/firebase";
import {getActiveMember} from "../shared/validators";
import {recalculateMonth} from "./recalculate";

export const getGroupSummary = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  const month = assertString(data.month, "month", 7);
  if (!/^\d{4}-\d{2}$/.test(month)) throw new functions.https.HttpsError("invalid-argument", "month must use YYYY-MM.");
  await getActiveMember(groupId, uid);
  await recalculateMonth(groupId, month);
  const summary = await db.doc(`groups/${groupId}/monthlySummary/${month}`).get();
  return {month, ...(summary.data() ?? {totalBazar: 0, totalExtraCost: 0, totalPayments: 0, totalMeals: 0, mealRate: 0, extraCostPerMember: 0, memberCountForExtraCost: 0, perMemberBreakdown: {}, finalized: false})};
});
