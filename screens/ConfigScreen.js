// screens/ConfigScreen.js
import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../theme/ThemeContext';


import fondoConfig from '../assets/fondo-config.jpg';

export default function ConfigScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);


  const gradientColors =
    theme.mode === 'dark'
      ? ['#000000df', '#1C1C1Cdf', '#2E2E2Edf'] 
      : ['#420420cd', '#aa2477cd', '#832b5bcd']; 

  return (
    <ImageBackground
      source={fondoConfig}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Overlay degradado encima de la imagen */}
      <LinearGradient colors={gradientColors} style={styles.overlay}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Configuración</Text>

          {/* Tarjeta glassmorphism */}
          <View
            style={[
              styles.card,
              {
                backgroundColor:
                  theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.20)'
                    : 'rgba(255,255,255,0.80)',
                borderColor:
                  theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.35)',
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                { color: theme.mode === 'dark' ? '#fff' : '#222' },
              ]}
            >
              Tema oscuro
            </Text>

            <Switch
              value={theme.mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1C4E9', true: '#151416ff' }}
              thumbColor={theme.mode === 'dark' ? '#fff' : '#070707ff'}
            />
          </View>

          <Text
            style={[
              styles.footer,
              { color: theme.mode === 'dark' ? '#ccc' : '#fff' },
            ]}
          >
            Personaliza tu experiencia
          </Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 35,
    letterSpacing: 0.5,
  },
  card: {
    width: '85%',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
  },
  footer: {
    fontSize: 14,
    marginTop: 20,
    opacity: 0.8,
  },
});
