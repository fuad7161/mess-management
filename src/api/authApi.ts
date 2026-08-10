import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {fbAuth, usersCol, callable} from './firebase';

export const sendOtp = (phone: string) => fbAuth.signInWithPhoneNumber(phone);
export const confirmOtp = (confirmation: FirebaseAuthTypes.ConfirmationResult, code: string) => confirmation.confirm(code);
export const createUserProfile = callable<{name: string; photoUrl?: string}, {success: true}>('createUserProfile');
export const getUserProfile = async (uid: string) => {
  const snapshot = await usersCol().doc(uid).get();
  return snapshot.exists() ? {uid, ...snapshot.data()} : null;
};
export const signOut = () => fbAuth.signOut();
