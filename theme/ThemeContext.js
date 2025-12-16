import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Función auxiliar para crear el objeto de tema con la estructura 'colors'
const createTheme = (mode, primary, background, text, card, border) => ({
  mode,
  colors: {
    // Estos campos son los que tus componentes estaban buscando
    primary: primary,
    background: background,
    text: text,
    // Valores adicionales para mayor compatibilidad con React Navigation
    card: card || background, 
    border: border || (mode === 'light' ? '#ccc' : '#444'),
  },
});

// Temas completos con la nueva estructura 'colors'
const lightTheme = createTheme(
  'light', 
  '#e91e63', // primary (color de acento)
  '#832b4aff', // background (el que usabas era #fff, #f5f5f5)
  '#333333' // text (el que usabas era #000)
);

const darkTheme = createTheme(
  'dark', 
  '#ff69b4', // primary (un tono más brillante para oscuro)
  '#121212', // background
  '#ffffff' // text
);


export const ThemeContext = createContext({ 
  theme: lightTheme, 
  toggleTheme: () => {} 
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  
  // Inicializar con el tema del sistema por defecto
  const initialMode = systemColorScheme === 'dark' ? 'dark' : 'light';
  const [mode, setMode] = useState(initialMode);
  

  // 1. Cargar tema guardado en AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('theme_mode');
        if (savedMode) {
          setMode(savedMode);
        }
      } catch (e) {
        console.error("Error loading theme from storage:", e);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  // 2. Función para alternar el tema y guardarlo
  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    try {
      await AsyncStorage.setItem('theme_mode', newMode);
    } catch (e) {
      console.error("Error saving theme to storage:", e);
    }
  };

  // 3. Crear el objeto 'theme' actual
  const currentTheme = useMemo(() => {
    const baseTheme = mode === 'dark' ? darkTheme : lightTheme;
    // Devolvemos el objeto de tema completo, incluyendo la función toggleTheme
    return { ...baseTheme, toggleTheme };
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};