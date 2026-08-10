import * as functions from "firebase-functions/v1";
import {monthsFromChange, recalculateMonth} from "../summary/recalculate";

export const onMealWrite = functions.firestore.document("groups/{groupId}/meals/{mealId}").onWrite(async (change, context) => {
  await Promise.all(monthsFromChange(change).map(month => recalculateMonth(context.params.groupId, month)));
});
