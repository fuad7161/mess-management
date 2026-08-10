import * as functions from "firebase-functions/v1";
import {assertString, db, requireUid, serverTimestamp} from "../shared/firebase";

export const createUserProfile = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const name = assertString(data.name, "name", 80);
  const user = await db.doc(`users/${uid}`).get();
  if (user.exists) return {success: true};
  await db.doc(`users/${uid}`).set({
    name,
    phone: context.auth?.token.phone_number ?? "",
    photoUrl: typeof data.photoUrl === "string" ? data.photoUrl.slice(0, 500) : null,
    currentGroupId: null,
    pendingGroupId: null,
    pendingGroupName: null,
    createdAt: serverTimestamp(),
  });
  return {success: true};
});

export const createGroup = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const name = assertString(data.name, "name", 100);
  const userRef = db.doc(`users/${uid}`);
  const groupRef = db.collection("groups").doc();
  await db.runTransaction(async transaction => {
    const user = await transaction.get(userRef);
    if (!user.exists) throw new functions.https.HttpsError("failed-precondition", "Create your profile first.");
    if (user.data()?.currentGroupId) throw new functions.https.HttpsError("already-exists", "You already belong to a group.");
    transaction.set(groupRef, {
      name, nameLower: name.toLowerCase(),
      description: typeof data.description === "string" ? data.description.trim().slice(0, 500) || null : null,
      location: typeof data.location === "string" ? data.location.trim().slice(0, 200) || null : null,
      createdBy: uid, createdAt: serverTimestamp(), status: "active", adminCount: 1, memberCount: 1,
      mealWeights: {breakfast: 0.5, lunch: 1, dinner: 1},
    });
    transaction.set(groupRef.collection("members").doc(uid), {role: "admin", active: true, joinedAt: serverTimestamp()});
    transaction.update(userRef, {currentGroupId: groupRef.id, pendingGroupId: null, pendingGroupName: null});
  });
  return {groupId: groupRef.id};
});

export const updateMealWeights = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const groupId = assertString(data.groupId, "groupId", 128);
  await (await import("../shared/validators")).requireAdmin(groupId, uid);
  const weights = [data.breakfast, data.lunch, data.dinner];
  if (weights.some(value => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 10)) {
    throw new functions.https.HttpsError("invalid-argument", "Meal weights must be between 0 and 10.");
  }
  await db.doc(`groups/${groupId}`).update({mealWeights: {breakfast: data.breakfast, lunch: data.lunch, dinner: data.dinner}});
  return {success: true};
});
