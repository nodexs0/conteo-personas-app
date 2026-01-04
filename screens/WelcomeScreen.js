import React from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, TouchableOpacity, Platform 
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

export default function WelcomeScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/welcome.jpg')} 
        style={styles.background}
      >
        {/* Overlay oscuro para legibilidad */}
        <View style={styles.overlay} />

        <View style={styles.contentContainer}>
          {/* Card con efecto de desenfoque (Blur) */}
          <View style={[
            styles.card, 
            { backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }
          ]}>
            <h1 style={styles.hiddenH1}>Presence Pro</h1> {/* Para SEO en Web */}
            
            <Text style={[styles.title, { color: theme.colors.primary || '#9f1342' }]}>
              Conteo de personas
            </Text>
            
            <Text style={[styles.subtitle, { color: theme.colors.text }]}>
              Aprovecha el poder de la IA para monitorear y gestionar asistencia de personas sin esfuerzo.
            </Text>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: '#9f1342' }]}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.buttonText}>Probar App</Text>
              <ArrowRight color="white" size={20} style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: '100%', height: '100%',justifyContent: 'center', alignItems: 'center' },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  contentContainer: {
    width: '90%',
    maxWidth: 600,
    padding: 20,
  },
  card: {
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(15px)', // Efecto Glassmorphism en Web
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      },
      default: {
        elevation: 10,
      }
    }),
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
    opacity: 0.9,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 35,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  hiddenH1: { position: 'absolute', opacity: 0 }
});