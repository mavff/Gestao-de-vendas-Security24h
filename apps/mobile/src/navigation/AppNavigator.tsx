import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { LeadsListScreen } from '../screens/LeadsListScreen';
import { LeadDetailsScreen } from '../screens/LeadDetailsScreen';
import { CreateLeadScreen } from '../screens/CreateLeadScreen';
import { CreateQuoteScreen } from '../screens/CreateQuoteScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Leads" component={LeadsListScreen} />
      <Tabs.Screen name="Novo Lead" component={CreateLeadScreen} />
      <Tabs.Screen name="Orçamento" component={CreateQuoteScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="LeadDetails" component={LeadDetailsScreen} options={{ title: 'Lead' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
