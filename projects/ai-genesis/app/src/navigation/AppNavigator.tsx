import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../config/theme';
import type { RootStackParamList, MainTabParamList } from '../types';

// 画面
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import InsightScreen from '../screens/InsightScreen';
import TimelineScreen from '../screens/TimelineScreen';
import LetterScreen from '../screens/LetterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🎙️',
    Timeline: '📖',
    Letters: '✉️',
    Settings: '⚙️',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>
      {icons[name] ?? '?'}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '話す' }} />
      <Tab.Screen name="Timeline" component={TimelineScreen} options={{ tabBarLabel: '記録' }} />
      <Tab.Screen name="Letters" component={LetterScreen} options={{ tabBarLabel: 'レター' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: '設定' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Echo</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Insight"
              component={InsightScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
  },
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 4,
    height: 84,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
