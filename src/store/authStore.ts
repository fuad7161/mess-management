import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {create} from 'zustand';
import {AppUser} from '../types/user';

interface AuthState {
  firebaseUser: FirebaseAuthTypes.User | null;
  profile: AppUser | null;
  confirmation: FirebaseAuthTypes.ConfirmationResult | null;
  initializing: boolean;
  setFirebaseUser: (user: FirebaseAuthTypes.User | null) => void;
  setProfile: (profile: AppUser | null) => void;
  setConfirmation: (confirmation: FirebaseAuthTypes.ConfirmationResult | null) => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  firebaseUser: null,
  profile: null,
  confirmation: null,
  initializing: true,
  setFirebaseUser: firebaseUser => set({firebaseUser}),
  setProfile: profile => set({profile}),
  setConfirmation: confirmation => set({confirmation}),
  setInitializing: initializing => set({initializing}),
}));
