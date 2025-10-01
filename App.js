import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import ConfigScreen from './screens/ConfigScreen';

import { ThemeProvider, ThemeContext } from './theme/ThemeContext';

const Tab = createBottomTabNavigator();

function MyTabs() {
  const { theme } = useContext(ThemeContext);

  return (
    <NavigationContainer theme={theme.mode === 'dark' ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Inicio') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Cámara') {
              iconName = focused ? 'camera' : 'camera-outline';
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
        <Tab.Screen name="Cámara" component={CameraScreen} options={{ headerShown: false, tabBarStyle: { display: 'none' }, }} />
        <Tab.Screen name="Configuración" component={ConfigScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MyTabs />
    </ThemeProvider>
  );
}
