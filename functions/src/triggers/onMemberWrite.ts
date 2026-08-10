import * as functions from "firebase-functions/v1";
import {recalculateMonth} from "../summary/recalculate";

export const onMemberWrite = functions.firestore.document("groups/{groupId}/members/{uid}").onWrite(async (change, context) => {
  const months = new Set<string>([new Date().toISOString().slice(0, 7)]);
  for (const snapshot of [change.before, change.after]) {
    for (const field of ["joinedAt", "activeSince", "leftAt"]) {
      const date = snapshot.data()?.[field]?.toDate?.();
      if (date instanceof Date) months.add(date.toISOString().slice(0, 7));
    }
  }
  await Promise.all([...months].map(month => recalculateMonth(context.params.groupId, month)));
});
