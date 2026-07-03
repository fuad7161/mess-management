import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Your web app's Firebase configuration
// For Firebase JS SDK in Expo, you MUST provide these. You can find them in your Firebase Console
// under Project Settings > General > Your apps (Web app).
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const fbAuth = getAuth(app);
export const db = getFirestore(app);
export const fbStorage = getStorage(app);
export const fns = getFunctions(app);

// Convenience typed collection refs
export const usersCol = collection(db, 'users');
export const groupsCol = collection(db, 'groups');

export const groupMembersCol = (groupId: string) =>
  collection(doc(db, 'groups', groupId), 'members');

export const joinRequestsCol = (groupId: string) =>
  collection(doc(db, 'groups', groupId), 'joinRequests');

export const mealsCol = (groupId: string) =>
  collection(doc(db, 'groups', groupId), 'meals');

export const expensesCol = (groupId: string) =>
  collection(doc(db, 'groups', groupId), 'expenses');

export const paymentsCol = (groupId: string) =>
  collection(doc(db, 'groups', groupId), 'payments');

export const monthlySummaryCol = (groupId: string) =>
  collection(doc(db, 'groups', groupId), 'monthlySummary');

// Callable function shortcuts
export const callCreateGroup = httpsCallable(fns, 'createGroup');
export const callRequestToJoinGroup = httpsCallable(fns, 'requestToJoinGroup');
export const callRespondToJoinRequest = httpsCallable(fns, 'respondToJoinRequest');
export const callPromoteToAdmin = httpsCallable(fns, 'promoteToAdmin');
export const callDemoteFromAdmin = httpsCallable(fns, 'demoteFromAdmin');
export const callLeaveGroup = httpsCallable(fns, 'leaveGroup');
export const callSubmitExpense = httpsCallable(fns, 'submitExpense');
export const callApproveExpense = httpsCallable(fns, 'approveExpense');
export const callFinalizeMonth = httpsCallable(fns, 'finalizeMonth');
