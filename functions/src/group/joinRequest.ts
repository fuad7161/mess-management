import * as functions from "firebase-functions/v1";
import {assertString, db, requireUid, serverTimestamp} from "../shared/firebase";
import {requireAdmin} from "../shared/validators";

export const requestToJoinGroup = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  const userRef = db.doc(`users/${uid}`);
  const groupRef = db.doc(`groups/${groupId}`);
  await db.runTransaction(async transaction => {
    const [user, target] = await Promise.all([transaction.get(userRef), transaction.get(groupRef)]);
    if (!target.exists || target.data()?.status !== "active") throw new functions.https.HttpsError("not-found", "Group not found.");
    if (user.data()?.pendingGroupId) throw new functions.https.HttpsError("already-exists", "You already have a pending request.");
    const oldGroupId = user.data()?.currentGroupId as string | undefined;
    if (oldGroupId === groupId) throw new functions.https.HttpsError("already-exists", "You already belong to this group.");
    if (oldGroupId) {
      const [oldGroup, member] = await Promise.all([
        transaction.get(db.doc(`groups/${oldGroupId}`)),
        transaction.get(db.doc(`groups/${oldGroupId}/members/${uid}`)),
      ]);
      if (member.data()?.role === "admin" && oldGroup.data()?.memberCount > 1 && oldGroup.data()?.adminCount <= 1) {
        throw new functions.https.HttpsError("failed-precondition", "Promote another member to admin before switching groups.");
      }
    }
    transaction.set(groupRef.collection("joinRequests").doc(uid), {uid, status: "pending", requestedAt: serverTimestamp()});
    transaction.update(userRef, {pendingGroupId: groupId, pendingGroupName: target.data()?.name ?? null});
  });
  return {success: true};
});

export const cancelJoinRequest = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  await db.runTransaction(async transaction => {
    transaction.delete(db.doc(`groups/${groupId}/joinRequests/${uid}`));
    transaction.update(db.doc(`users/${uid}`), {pendingGroupId: null, pendingGroupName: null});
  });
  return {success: true};
});

export const respondToJoinRequest = functions.https.onCall(async (data, context) => {
  const adminUid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  const requestUid = assertString(data.requestUid, "requestUid", 128);
  if (requestUid === adminUid) throw new functions.https.HttpsError("permission-denied", "You cannot approve yourself.");
  if (data.decision !== "approve" && data.decision !== "reject") throw new functions.https.HttpsError("invalid-argument", "Invalid decision.");
  await requireAdmin(groupId, adminUid);
  const requestRef = db.doc(`groups/${groupId}/joinRequests/${requestUid}`);
  const userRef = db.doc(`users/${requestUid}`);
  await db.runTransaction(async transaction => {
    const targetGroupRef = db.doc(`groups/${groupId}`);
    const targetMemberRef = db.doc(`groups/${groupId}/members/${requestUid}`);
    const [request, user, targetGroup, previousTargetMember] = await Promise.all([transaction.get(requestRef), transaction.get(userRef), transaction.get(targetGroupRef), transaction.get(targetMemberRef)]);
    if (!request.exists || request.data()?.status !== "pending") throw new functions.https.HttpsError("not-found", "Pending request not found.");
    if (data.decision === "reject") {
      transaction.update(requestRef, {status: "rejected", respondedAt: serverTimestamp(), respondedBy: adminUid});
      transaction.update(userRef, {pendingGroupId: null, pendingGroupName: null});
      return;
    }
    const oldGroupId = user.data()?.currentGroupId as string | undefined;
    if (oldGroupId && oldGroupId !== groupId) {
      const oldGroupRef = db.doc(`groups/${oldGroupId}`);
      const oldMemberRef = db.doc(`groups/${oldGroupId}/members/${requestUid}`);
      const [oldGroup, oldMember] = await Promise.all([transaction.get(oldGroupRef), transaction.get(oldMemberRef)]);
      const role = oldMember.data()?.role;
      if (role === "admin" && oldGroup.data()?.memberCount > 1 && oldGroup.data()?.adminCount <= 1) {
        throw new functions.https.HttpsError("failed-precondition", "Requester is still the last admin of their current group.");
      }
      if (oldGroup.data()?.memberCount === 1) transaction.update(oldGroupRef, {status: "deleted", memberCount: 0, adminCount: 0, deletedAt: serverTimestamp()});
      else transaction.update(oldGroupRef, {memberCount: Math.max(0, oldGroup.data()!.memberCount - 1), adminCount: Math.max(0, oldGroup.data()!.adminCount - (role === "admin" ? 1 : 0))});
      transaction.set(oldMemberRef, {active: false, leftAt: serverTimestamp()}, {merge: true});
    }
    transaction.set(targetMemberRef, {
      role: "member", active: true,
      joinedAt: previousTargetMember.data()?.joinedAt ?? serverTimestamp(),
      activeSince: serverTimestamp(), leftAt: null,
    }, {merge: true});
    transaction.update(targetGroupRef, {memberCount: targetGroup.data()!.memberCount + 1});
    transaction.update(userRef, {currentGroupId: groupId, pendingGroupId: null, pendingGroupName: null});
    transaction.update(requestRef, {status: "approved", respondedAt: serverTimestamp(), respondedBy: adminUid});
  });
  return {success: true};
});
