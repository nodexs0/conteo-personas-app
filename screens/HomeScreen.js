// screens/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <ImageBackground
      source={require('../assets/imagen-main.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      {/* Degradado global sobre el fondo */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)']}
        style={styles.overlay}
      >
        {/* Logos */}
        <View style={styles.header}>
          <Image source={require('../assets/logoipn.png')} style={styles.logoSmall} />
          <Image source={require('../assets/logoupiit.png')} style={styles.logoSmall} />
        </View>

        {/* Tarjeta flotante */}
        <View style={styles.card}>
          <Text style={styles.title}>Sistema de Detección y Conteo de Personas</Text>
          <Text style={styles.subtitle}>
            Visualiza en tiempo real el número de personas detectadas en video.
           
          </Text>

          <LinearGradient
            colors={['#651D32', '#651D32']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.button}
          >
            <TouchableOpacity onPress={() => navigation.navigate('Cámara')}>
              <Text style={styles.buttonText}>Iniciar Conteo</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <Text style={styles.footer}> UPIIT | Instituto Politécnico Nacional</Text>
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
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
    marginTop: 25,
  },
  logoSmall: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    marginHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  button: {
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
});

