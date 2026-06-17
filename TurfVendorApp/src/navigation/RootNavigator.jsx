import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { View, Text } from 'react-native';
import MainTabs from './MainTabs';
import LoginScreen from '../screens/LoginScreen';

const Stack = createStackNavigator();

const DummyScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{route.name}</Text>
  </View>
);

export default function RootNavigator() {
  const { token } = useSelector(state => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
