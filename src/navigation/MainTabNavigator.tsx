import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import MealSheetScreen from '../screens/meals/MealSheetScreen';
import BazarSheetScreen from '../screens/bazar/BazarSheetScreen';
import PaymentSheetScreen from '../screens/payments/PaymentSheetScreen';
import ExtraCostSheetScreen from '../screens/extraCost/ExtraCostSheetScreen';
import {useGroupListener} from '../hooks/useGroupListener';
import GroupSettingsScreen from '../screens/group/GroupSettingsScreen';
import MemberManagementScreen from '../screens/group/MemberManagementScreen';
import JoinRequestsScreen from '../screens/group/JoinRequestsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const icons: Record<string, string> = {Dashboard: '⌂', Meals: '🍽', Bazar: '🛒', Payments: '৳', 'Extra Cost': '⚡'};

export default function MainTabNavigator() {
  useGroupListener();
  return <Tab.Navigator screenOptions={({route}) => ({
    headerShown: false,
    tabBarIcon: () => <>{icons[route.name]}</>,
    tabBarActiveTintColor: '#22577a',
  })}>
    <Tab.Screen name="Dashboard" component={DashboardStack} />
    <Tab.Screen name="Meals" component={MealSheetScreen} />
    <Tab.Screen name="Bazar" component={BazarSheetScreen} />
    <Tab.Screen name="Payments" component={PaymentSheetScreen} />
    <Tab.Screen name="Extra Cost" component={ExtraCostSheetScreen} />
  </Tab.Navigator>;
}

function DashboardStack() {
  return <Stack.Navigator>
    <Stack.Screen name="DashboardHome" component={DashboardScreen} options={{headerShown: false}} />
    <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{title: 'Group settings'}} />
    <Stack.Screen name="Members" component={MemberManagementScreen} />
    <Stack.Screen name="JoinRequests" component={JoinRequestsScreen} options={{title: 'Join requests'}} />
  </Stack.Navigator>;
}
