// src/api/firebase.ts
//
// @react-native-firebase auto-initializes the default app from
// android/app/google-services.json — no initializeApp() call needed.
// This file just centralizes typed access to each service so the rest
// of the app imports from here instead of the raw RNFirebase modules.

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';

export const fbAuth = auth();
export const db = firestore();
export const fbStorage = storage();
export const fns = functions();

// Optional: point at the local emulator suite during development.
// Uncomment and set __DEV__ handling as needed.
//
// if (__DEV__) {
//   db.useEmulator('localhost', 8080);
//   fbAuth.useEmulator('http://localhost:9099');
//   fns.useEmulator('localhost', 5001);
//   fbStorage.useEmulator('localhost', 9199);
// }

// Convenience typed collection refs matching the schema in design-architecture.md
export const usersCol = db.collection('users');
export const groupsCol = db.collection('groups');

export const groupMembersCol = (groupId: string) =>
  db.collection('groups').doc(groupId).collection('members');

export const joinRequestsCol = (groupId: string) =>
  db.collection('groups').doc(groupId).collection('joinRequests');

export const mealsCol = (groupId: string) =>
  db.collection('groups').doc(groupId).collection('meals');

export const expensesCol = (groupId: string) =>
  db.collection('groups').doc(groupId).collection('expenses');

export const paymentsCol = (groupId: string) =>
  db.collection('groups').doc(groupId).collection('payments');

export const monthlySummaryCol = (groupId: string) =>
  db.collection('groups').doc(groupId).collection('monthlySummary');

// Callable function shortcuts (add more as you implement functions/src/*)
export const callCreateGroup = fns.httpsCallable('createGroup');
export const callRequestToJoinGroup = fns.httpsCallable('requestToJoinGroup');
export const callRespondToJoinRequest = fns.httpsCallable('respondToJoinRequest');
export const callPromoteToAdmin = fns.httpsCallable('promoteToAdmin');
export const callDemoteFromAdmin = fns.httpsCallable('demoteFromAdmin');
export const callLeaveGroup = fns.httpsCallable('leaveGroup');
export const callSubmitExpense = fns.httpsCallable('submitExpense');
export const callApproveExpense = fns.httpsCallable('approveExpense');
export const callFinalizeMonth = fns.httpsCallable('finalizeMonth');
