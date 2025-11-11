import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Necesario para la autenticación web en Expo.
WebBrowser.maybeCompleteAuthSession();

// 1. Exportación Nombrada
export const AuthContext = createContext();

// *******************************************************************
// IMPORTANTE: REEMPLAZA ESTE VALOR con tu Client ID de Aplicación Web
// obtenido de Google Cloud Console.
// *******************************************************************
const WEB_CLIENT_ID = '71881995759-ehtfvr76kl4lad72gdhbf0tclg1ikuj6.apps.googleusercontent.com'; // <-- ¡AQUÍ VA TU ID REAL!

const USER_STORAGE_KEY = 'user_data_expo_app';

// 2. Exportación Nombrada
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hook de Expo para iniciar el flujo de Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Manejo de la respuesta de autenticación
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUserInfo(authentication.accessToken);
    }
  }, [response]);

  // Función para obtener la información del usuario usando el token de acceso
  const fetchUserInfo = async (token) => {
    try {
      const infoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = await infoResponse.json();
      
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUser(null);
    }
  };

  // Cargar el usuario desde el almacenamiento al iniciar la aplicación
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Error loading user from AsyncStorage:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Función para iniciar sesión (llama a promptAsync, que abre el navegador)
  const signIn = async () => {
    try {
      if (!request) {
        console.warn('Authentication request is not ready.');
        return;
      }
      await promptAsync();
    } catch (e) {
      console.error('Error signing in with Google:', e);
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } catch (e) {
      console.error('Error signing out:', e);
    }
  };

  // Exportamos los valores del contexto
  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Exportación Nombrada
export const useAuth = () => useContext(AuthContext); 