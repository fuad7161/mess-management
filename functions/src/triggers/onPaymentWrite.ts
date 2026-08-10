import * as functions from "firebase-functions/v1";
import {monthsFromChange, recalculateMonth} from "../summary/recalculate";

export const onPaymentWrite = functions.firestore.document("groups/{groupId}/payments/{paymentId}").onWrite(async (change, context) => {
  await Promise.all(monthsFromChange(change).map(month => recalculateMonth(context.params.groupId, month)));
});
