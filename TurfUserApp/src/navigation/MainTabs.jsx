import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../utils/theme';

import { View, Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();

const DummyExplore = () => <View style={{flex:1}}><Text>Explore</Text></View>;
const DummyBookings = () => <View style={{flex:1}}><Text>Bookings</Text></View>;
const DummyProfile = () => <View style={{flex:1}}><Text>Profile</Text></View>;

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
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Explore') iconName = 'search';
          else if (route.name === 'Bookings') iconName = 'event-note';
          else if (route.name === 'Profile') iconName = 'person';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={DummyExplore} />
      <Tab.Screen name="Bookings" component={DummyBookings} />
      <Tab.Screen name="Profile" component={DummyProfile} />
    </Tab.Navigator>
  );
}
