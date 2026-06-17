import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import RootNavigator from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { COLORS } from './src/utils/theme';

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
