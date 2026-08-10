import * as functions from "firebase-functions/v1";
import {assertString, db, requireUid, serverTimestamp} from "../shared/firebase";
import {requireAdmin} from "../shared/validators";

export const leaveGroup = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  const groupRef = db.doc(`groups/${groupId}`);
  const memberRef = db.doc(`groups/${groupId}/members/${uid}`);
  await db.runTransaction(async transaction => {
    const [group, member] = await Promise.all([transaction.get(groupRef), transaction.get(memberRef)]);
    if (!group.exists || !member.exists || member.data()?.active !== true) throw new functions.https.HttpsError("not-found", "Active membership not found.");
    const groupData = group.data()!;
    const isAdmin = member.data()?.role === "admin";
    if (isAdmin && groupData.memberCount > 1) throw new functions.https.HttpsError("failed-precondition", "Admins must be demoted by another admin before leaving.");
    if (groupData.memberCount === 1) transaction.update(groupRef, {status: "deleted", memberCount: 0, adminCount: 0, deletedAt: serverTimestamp()});
    else transaction.update(groupRef, {memberCount: groupData.memberCount - 1, adminCount: groupData.adminCount - (isAdmin ? 1 : 0)});
    transaction.update(memberRef, {active: false, leftAt: serverTimestamp()});
    transaction.update(db.doc(`users/${uid}`), {currentGroupId: null});
  });
  return {success: true};
});

export const deleteGroup = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  await requireAdmin(groupId, uid);
  const members = await db.collection(`groups/${groupId}/members`).where("active", "==", true).get();
  const batch = db.batch();
  batch.update(db.doc(`groups/${groupId}`), {status: "deleted", memberCount: 0, adminCount: 0, deletedAt: serverTimestamp(), deletedBy: uid});
  members.docs.forEach(member => {
    batch.update(member.ref, {active: false, leftAt: serverTimestamp()});
    batch.update(db.doc(`users/${member.id}`), {currentGroupId: null});
  });
  await batch.commit();
  return {success: true};
});
