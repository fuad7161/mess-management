import * as functions from "firebase-functions/v1";
import {assertString, db, requireUid} from "../shared/firebase";
import {requireAdmin} from "../shared/validators";

const changeRole = (promote: boolean) => functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  const targetUid = assertString(data.targetUid, "targetUid", 128);
  await requireAdmin(groupId, uid);
  const groupRef = db.doc(`groups/${groupId}`);
  const memberRef = db.doc(`groups/${groupId}/members/${targetUid}`);
  await db.runTransaction(async transaction => {
    const [group, member] = await Promise.all([transaction.get(groupRef), transaction.get(memberRef)]);
    if (!member.exists || member.data()?.active !== true) throw new functions.https.HttpsError("not-found", "Active member not found.");
    const currentRole = member.data()?.role;
    if (promote && currentRole === "admin" || !promote && currentRole === "member") return;
    if (!promote && group.data()!.adminCount <= 1) throw new functions.https.HttpsError("failed-precondition", "The final admin cannot be demoted.");
    transaction.update(memberRef, {role: promote ? "admin" : "member"});
    transaction.update(groupRef, {adminCount: group.data()!.adminCount + (promote ? 1 : -1)});
  });
  return {success: true};
});

export const promoteToAdmin = changeRole(true);
export const demoteFromAdmin = changeRole(false);
