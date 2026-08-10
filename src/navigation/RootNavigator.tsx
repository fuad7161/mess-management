import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {fbAuth, useFirebaseEmulators, usersCol} from '../api/firebase';
import {useAuthStore} from '../store';
import {AppUser} from '../types/user';
import {Loader} from '../components/common';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import CompleteProfileScreen from '../screens/auth/CompleteProfileScreen';
import NoGroupScreen from '../screens/onboarding/NoGroupScreen';
import SearchGroupScreen from '../screens/onboarding/SearchGroupScreen';
import CreateGroupScreen from '../screens/onboarding/CreateGroupScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator();
let emulatorsConfigured = false;

const RootNavigator = () => {
  const {firebaseUser, profile, initializing, setFirebaseUser, setProfile, setInitializing} = useAuthStore();
  useEffect(() => {
    if (!emulatorsConfigured) { useFirebaseEmulators(); emulatorsConfigured = true; }
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = fbAuth.onAuthStateChanged(user => {
      unsubscribeProfile?.();
      setFirebaseUser(user);
      if (!user) { setProfile(null); setInitializing(false); return; }
      unsubscribeProfile = usersCol().doc(user.uid).onSnapshot(snapshot => {
        setProfile(snapshot.exists() ? ({uid: user.uid, ...snapshot.data()} as AppUser) : null);
        setInitializing(false);
      }, () => setInitializing(false));
    });
    return () => { unsubscribeAuth(); unsubscribeProfile?.(); };
  }, [setFirebaseUser, setInitializing, setProfile]);
  if (initializing) return <Loader />;
  if (!firebaseUser) return <Stack.Navigator><Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}} /><Stack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{title: 'Verify phone'}} /></Stack.Navigator>;
  if (!profile) return <Stack.Navigator><Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{headerShown: false}} /></Stack.Navigator>;
  if (!profile?.currentGroupId) return <Stack.Navigator><Stack.Screen name="NoGroup" component={NoGroupScreen} options={{headerShown: false}} /><Stack.Screen name="SearchGroup" component={SearchGroupScreen} options={{title: 'Find a mess'}} /><Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{title: 'Create a mess'}} /></Stack.Navigator>;
  return <MainTabNavigator />;
};

export default RootNavigator;
