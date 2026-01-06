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
import WelcomeScreen from './screens/WelcomeScreen';
// Importamos el nuevo Navigator de Autenticación
import AuthNavigator from './screens/AuthScreen'; 

import { ThemeProvider, ThemeContext } from './theme/ThemeContext';
import { AuthProvider, AuthContext } from './AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// --- Componente 1: Tab Navigator (Pestañas inferiores) ---
function TabNavigator() {
  const { theme } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarStyle: { 
          backgroundColor: theme.colors.card, // Usar color del tema para la barra
          borderTopColor: theme.colors.border || 'gray',
        },
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
        // Aseguramos que los colores de la pestaña se adapten al tema
        tabBarActiveTintColor: theme.colors.primary || '#e91e63',
        tabBarInactiveTintColor: theme.colors.text || 'gray',
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
  // Obtenemos el usuario y el estado de carga
  const { user, isLoading } = useContext(AuthContext); 

  // Aplicamos el tema de navegación
  const appTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  
  // Adaptar colores del tema al DefaultTheme/DarkTheme de React Navigation
  appTheme.colors.primary = theme.colors.primary || '#e91e63';
  appTheme.colors.background = theme.colors.background;
  appTheme.colors.card = theme.colors.card;
  appTheme.colors.text = theme.colors.text;

  return (
    <NavigationContainer theme={appTheme}>
      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: appTheme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary || '#e91e63'} />
        </View>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          
          {/* LÓGICA DE RENDERIZADO CONDICIONAL */}
          {user ? (
            <>
              {/* Si el usuario existe, muestra las pestañas y las pantallas internas */}
              <Stack.Screen name="Tabs" component={TabNavigator} />
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
            </>
          ) : (
            <>
              {/* Si no hay usuario, muestra el Stack de Autenticación */}
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Auth" component={AuthNavigator} />
            </>
          )}
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