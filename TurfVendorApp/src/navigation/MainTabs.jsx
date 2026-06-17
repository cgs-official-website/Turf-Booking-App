import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../utils/theme';

import { View, Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';

const Tab = createBottomTabNavigator();

const DummyTurfs = () => <View style={{flex:1}}><Text>My Turfs</Text></View>;
const DummyBookings = () => <View style={{flex:1}}><Text>Bookings</Text></View>;
const DummyAccount = () => <View style={{flex:1}}><Text>Account</Text></View>;

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.subtext,
        tabBarStyle: { backgroundColor: COLORS.card, borderTopColor: COLORS.border },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'dashboard';
          else if (route.name === 'My Turfs') iconName = 'sports-soccer';
          else if (route.name === 'Bookings') iconName = 'event';
          else if (route.name === 'Account') iconName = 'manage-accounts';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="My Turfs" component={DummyTurfs} />
      <Tab.Screen name="Bookings" component={DummyBookings} />
      <Tab.Screen name="Account" component={DummyAccount} />
    </Tab.Navigator>
  );
}
