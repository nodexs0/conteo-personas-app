import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext();

const USER_STORAGE_KEY = 'user_data_expo_app';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configuración de Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "603547577917-j53v45295fqlem2qggfl0abm7rtae8rh.apps.googleusercontent.com",
    androidClientId: "603547577917-ivi5qjvttcoqrr74mgfpponiompdkije.apps.googleusercontent.com",
    iosClientId: "TU_IOS_CLIENT_ID.apps.googleusercontent.com", // Asegúrate de cambiar esto
    scopes: ["profile", "email"],
    useProxy: true,
  });

  // Manejar la respuesta de Google Auth
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUserInfo(authentication.accessToken);
    }
  }, [response]);

  // Obtener datos del usuario de Google
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

  // Cargar usuario desde AsyncStorage al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error loading user from AsyncStorage:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // Funciones de Autenticación
  
  // 1. Iniciar sesión o Registrar con Google
  const signInWithGoogle = async () => {
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

  // 2. Placeholder para Iniciar sesión con Email/Password
  const signInWithEmail = async (email, password) => {
    setIsLoading(true);
    // Aquí iría la lógica real de Firebase o tu backend
    console.log(`Iniciando sesión con: ${email} / ${password}`);
    
    // Simulación de éxito
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setUser({ name: 'Usuario Demo', email });
    setIsLoading(false);
  };

  // 3. Placeholder para Registro con Email/Password
  const registerWithEmail = async (email, password) => {
    setIsLoading(true);
    // Aquí iría la lógica real de Firebase o tu backend
    console.log(`Registrando con: ${email} / ${password}`);
    
    // Simulación de éxito (y luego iniciar sesión)
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setUser({ name: 'Usuario Nuevo', email });
    setIsLoading(false);
  };


  // 4. Cerrar sesión
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } catch (e) {
      console.error('Error signing out:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      signInWithGoogle, 
      signInWithEmail, 
      registerWithEmail,
      signOut, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


