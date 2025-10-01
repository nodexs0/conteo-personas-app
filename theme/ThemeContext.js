import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightTheme = {
  mode: 'light',
  background: '#fff',
  text: '#000',
};

const darkTheme = {
  mode: 'dark',
  background: '#121212',
  text: '#fff',
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    (async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setTheme(darkTheme);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    if (theme.mode === 'light') {
      setTheme(darkTheme);
      await AsyncStorage.setItem('theme', 'dark');
    } else {
      setTheme(lightTheme);
      await AsyncStorage.setItem('theme', 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
