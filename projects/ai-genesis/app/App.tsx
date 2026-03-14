import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuth } from './src/hooks/useAuth';

function AppContent() {
  const { initialize } = useAuth();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
