import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export const AuthContext = createContext();


const CLIENT_ID = '603547577917-j53v45295fqlem2qggfl0abm7rtae8rh.apps.googleusercontent.com'; 

const USER_STORAGE_KEY = 'user_data_expo_app';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: CLIENT_ID,

    androidClientId: CLIENT_ID, 
    scopes: ['profile', 'email'],

    useProxy: true, 
  });

 
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUserInfo(authentication.accessToken);
    }
  }, [response]);

  
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

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);