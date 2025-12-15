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
  // ⬅️ NUEVO ESTADO: Para almacenar el token de acceso de Google Drive
  const [googleAccessToken, setGoogleAccessToken] = useState(null); 

  // Configuración de Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "5913171432-8rts4313ot3330dg5ed44u9evk46pb15.apps.googleusercontent.com",
    androidClientId: "5913171432-hb826pmbtbdn62o9kith3o4ghdoek7jv.apps.googleusercontent.com",
    iosClientId: "TU_IOS_CLIENT_ID.apps.googleusercontent.com", // Asegúrate de cambiar esto
    // ✅ Scope de Drive añadido (ya está correcto)
    scopes: ["profile", "email", "https://www.googleapis.com/auth/drive.file"], 
    // useProxy: true, // Lo dejamos comentado, como tú lo tienes.
  });

  // Para la URI (Dejamos tu código de depuración intacto)
  useEffect(() => {
    if (request) {
      console.log("-----------------------------------------");
      console.log("URI DE REDIRECCIÓN A REGISTRAR EN GOOGLE:");
      console.log(request.redirectUri); // Imprimirá la URI
      console.log("-----------------------------------------");
    }
  }, [request]);

  // Manejar la respuesta de Google Auth
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      
      // 1. Extraer y guardar el token para Drive
      const accessToken = authentication.accessToken; 
      setGoogleAccessToken(accessToken); // ⬅️ Corregida la asignación del estado
      
      // 2. Obtener la información del perfil del usuario (usando el token)
      fetchUserInfo(accessToken);
    } else if (response?.type === 'error') {
      console.error('Error de autenticación:', response.error);
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

  // 2. Placeholder para Iniciar sesión con Email/Password (omito para brevedad)
  const signInWithEmail = async (email, password) => {
    setIsLoading(true);
    console.log(`Iniciando sesión con: ${email} / ${password}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setUser({ name: 'Usuario Demo', email });
    setIsLoading(false);
  };

  // 3. Placeholder para Registro con Email/Password (omito para brevedad)
  const registerWithEmail = async (email, password) => {
    setIsLoading(true);
    console.log(`Registrando con: ${email} / ${password}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setUser({ name: 'Usuario Nuevo', email });
    setIsLoading(false);
  };


  // 4. Cerrar sesión
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      // Limpiar también el token de Google
      setGoogleAccessToken(null); 
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
      isLoading,
      googleAccessToken // ⬅️ EXPONER EL TOKEN para Drive
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);