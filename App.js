import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import ConfigScreen from './screens/ConfigScreen';
import HistoryScreen from './screens/HistoryScreen';
import DoorDetectionScreen from './screens/DoorDetectionScreen';
import ReportScreen from './screens/Report';

import { ThemeProvider, ThemeContext } from './theme/ThemeContext';
import { AuthProvider, AuthContext } from './AuthContext';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MyTabs() {
  const { theme } = useContext(ThemeContext);
  const { isLoading } = useContext(AuthContext);

  if (isLoading) {
    const backgroundColor = theme.mode === 'dark' ? DarkTheme.colors.background : DefaultTheme.colors.background;
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.mode === 'dark' ? '#fff' : '#e91e63'} />
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cámara') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Historial') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Configuración') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen
        name="Cámara"
        component={CameraScreen}
        options={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      />
      <Tab.Screen name="Historial" component={HistoryScreen} />
      <Tab.Screen name="Configuración" component={ConfigScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { theme } = useContext(ThemeContext);

  return (
    <NavigationContainer theme={theme.mode === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Usamos Stack.Navigator para poder navegar a DoorDetectionScreen sin las pestañas */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={MyTabs} />
        <Stack.Screen name="DoorDetection" component={DoorDetectionScreen} />
        <Stack.Screen name="Reporte" component={ReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});