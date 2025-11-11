import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import ConfigScreen from './screens/ConfigScreen';
import HistoryScreen from './screens/HistoryScreen';
import DoorDetectionScreen from './screens/DoorDetectionScreen';
import ReportScreen from './screens/Report';
import CameraScreen from './screens/CameraScreen';

import { ThemeProvider, ThemeContext } from './theme/ThemeContext';
import { AuthProvider, AuthContext } from './AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- Componente 1: Tab Navigator (Pestañas inferiores) ---
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
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
      <Tab.Screen name="Historial" component={HistoryScreen} />
      <Tab.Screen name="Configuración" component={ConfigScreen} />
    </Tab.Navigator>
  );
}

// --- Componente 2: Root Navigator (Navegación principal con Stack) ---
function RootNavigator() {
  const { theme } = useContext(ThemeContext);
  const { isLoading } = useContext(AuthContext);

  const appTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer theme={appTheme}>
      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: appTheme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.mode === 'dark' ? '#fff' : '#e91e63'} />
        </View>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Ruta principal con las pestañas */}
          <Stack.Screen name="Tabs" component={TabNavigator} />
          
          {/* Pantallas adicionales sin pestañas */}
          <Stack.Screen 
            name="Cámara" 
            component={CameraScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="DoorDetection" 
            component={DoorDetectionScreen} 
          />
          <Stack.Screen 
            name="Reporte" 
            component={ReportScreen} 
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

// --- Componente Principal de Expo ---
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
  },
});