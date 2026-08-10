import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import storage from '@react-native-firebase/storage';

export const fbAuth = auth();
export const db = firestore();
export const fns = functions();
export const fbStorage = storage();

export const usersCol = () => db.collection('users');
export const groupsCol = () => db.collection('groups');
export const groupMembersCol = (groupId: string) => db.collection(`groups/${groupId}/members`);
export const joinRequestsCol = (groupId: string) => db.collection(`groups/${groupId}/joinRequests`);
export const mealsCol = (groupId: string) => db.collection(`groups/${groupId}/meals`);
export const expensesCol = (groupId: string) => db.collection(`groups/${groupId}/expenses`);
export const paymentsCol = (groupId: string) => db.collection(`groups/${groupId}/payments`);
export const monthlySummaryCol = (groupId: string) => db.collection(`groups/${groupId}/monthlySummary`);

export const useFirebaseEmulators = () => {
  if (!__DEV__ || process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS !== 'true') return;
  fbAuth.useEmulator('http://10.0.2.2:9099');
  db.useEmulator('10.0.2.2', 8080);
  fns.useEmulator('10.0.2.2', 5001);
  fbStorage.useEmulator('10.0.2.2', 9199);
};

export const callable = <TInput, TOutput>(name: string) =>
  (input: TInput) => fns.httpsCallable(name)(input).then(result => result.data as TOutput);
