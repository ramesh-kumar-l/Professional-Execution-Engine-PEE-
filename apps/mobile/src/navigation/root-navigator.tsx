import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../auth/auth-context';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { GoalDetailScreen } from '../screens/GoalDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProjectsScreen } from '../screens/ProjectsScreen';

export type RootStackParamList = {
  Projects: undefined;
  GoalDetail: { projectId: string };
  Analytics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Login ⇄ Projects ⇄ GoalDetail ⇄ Analytics — the mobile equivalent of apps/desktop's App.tsx
 *  view switch, using React Navigation's stack instead of local view-union state. */
export function RootNavigator(): React.JSX.Element | null {
  const { user, restoring } = useAuth();

  if (restoring) return null;
  if (!user) return <LoginScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Projects' }} />
        <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ title: 'Goal' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
