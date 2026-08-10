import * as functions from "firebase-functions/v1";
import {getApps, initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";

if (!getApps().length) initializeApp();

export const db = getFirestore();
export const serverTimestamp = FieldValue.serverTimestamp;

export const requireUid = (context: functions.https.CallableContext) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in is required.");
  return context.auth.uid;
};

export const assertString = (value: unknown, field: string, max = 200) => {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new functions.https.HttpsError("invalid-argument", `${field} is invalid.`);
  }
  return value.trim();
};
