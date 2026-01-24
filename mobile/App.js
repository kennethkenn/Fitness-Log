import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ApolloProvider } from '@apollo/client/react';
import client from './src/api/client';
import { theme } from './src/theme';

// Screens placeholder (to be implemented)
import HomeScreen from './src/screens/HomeScreen';
import WorkoutSession from './src/screens/WorkoutSession';
import HistoryScreen from './src/screens/HistoryScreen';
import AnalyticsScreen from './src/screens/Analytics';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ApolloProvider client={client}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Fitness Log' }} />
          <Stack.Screen name="Workout" component={WorkoutSession} options={{ title: 'Live Workout' }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Workout History' }} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Your Progress' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}
