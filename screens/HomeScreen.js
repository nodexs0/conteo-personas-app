import React from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ImageBackground, Platform, useWindowDimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;

  return (
    <ImageBackground
      source={require('../assets/imagen-main.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      {/* Overlay oscuro para mejorar contraste de los textos */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
        style={styles.overlay}
      >
        
        {/* LOGOS - Superiores */}
        <View style={styles.header}>
          <Image source={require('../assets/logoipn.png')} style={styles.logoSmall} />
          <Image source={require('../assets/logoupiit.png')} style={styles.logoSmall} />
        </View>

        {/* TARJETA CENTRAL (Glassmorphism) */}
        <View style={styles.centerContainer}>
          <View style={[
            styles.card, 
            { width: isLargeScreen ? 600 : '90%' }
          ]}>
            <Text style={styles.title}>
              Sistema de Detección y Conteo de Personas
            </Text>
            
            <Text style={styles.subtitle}>
              Visualiza en tiempo real el número de personas detectadas en video mediante IA.
            </Text>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Cámara')}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={['#9f1342', '#651D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Iniciar Conteo</Text>
                <ArrowRight color="white" size={22} style={{ marginLeft: 10 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            UPIIT | Instituto Politécnico Nacional
          </Text>
        </View>

      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between', // Separa Header, Card y Footer
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 10,
  },
  logoSmall: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    filter: Platform.OS === 'web' ? 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' : undefined,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // Efecto de vidrio
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 20px 40px rgba(0,0,0,0.4)',
      },
      default: {
        elevation: 8,
      }
    }),
  },
  title: {
    fontSize: Platform.OS === 'web' ? 36 : 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 35,
    maxWidth: 450,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 280,
  },
  button: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    letterSpacing: 1,
  },
});