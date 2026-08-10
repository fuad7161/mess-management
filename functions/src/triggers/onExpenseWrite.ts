import * as functions from "firebase-functions/v1";
import {monthsFromChange, recalculateMonth} from "../summary/recalculate";

export const onExpenseWrite = functions.firestore.document("groups/{groupId}/expenses/{expenseId}").onWrite(async (change, context) => {
  await Promise.all(monthsFromChange(change).map(month => recalculateMonth(context.params.groupId, month)));
});
