// screens/ConfigScreen.js
import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../theme/ThemeContext';
import { useAuth } from '../AuthContext'; 
import { Ionicons } from '@expo/vector-icons';


import fondoConfig from '../assets/fondo-configu.jpg';

export default function ConfigScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  const { user, signIn, signOut } = useAuth();


  const gradientColors =
    theme.mode === 'dark'
      ? ['#000000df', '#1C1C1Cdf', '#2E2E2Edf'] 
      : ['#651D32', '#651D32', '#832b4aff']; 

  
  const cardTextColor = theme.mode === 'dark' ? '#fff' : '#222';
  
  
  const cardStyle = {
    backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.80)',
    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)',
  };


  
  const OptionCard = ({ children, onPress, iconName, buttonColor = '#e91e63' }) => (
    <TouchableOpacity 
      style={[styles.card, cardStyle]} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress} // Deshabilita el toque si no hay onPress
    >
      <View style={styles.cardContent}>
        <Text style={[styles.text, { color: cardTextColor }]}>{children}</Text>
        {onPress && (
            <Ionicons name={iconName} size={24} color={buttonColor} style={styles.cardIcon} />
        )}
      </View>
    </TouchableOpacity>
  );


  return (
   
      <LinearGradient colors={gradientColors} style={styles.overlay}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Configuración</Text>

          {/* Tarjeta de tema oscuro */}
          <View style={[styles.card, cardStyle]}>
            <Text style={[styles.text, { color: cardTextColor }]}>Tema oscuro</Text>
            <Switch
              value={theme.mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1C4E9', true: '#151416ff' }}
              thumbColor={theme.mode === 'dark' ? '#fff' : '#070707ff'}
            />
          </View>
          
          {/* Tarjeta de Autenticación */}
          {user ? (
            
            <View style={[styles.userInfoCard, cardStyle]}>
                <Image 
                    source={{ uri: user.picture }} 
                    style={styles.profilePicture} 
                    
                    onError={() => console.log('Error al cargar la imagen de perfil')} 
                />
                <View style={styles.userInfoText}>
                    <Text style={[styles.userName, { color: cardTextColor }]}>{user.name}</Text>
                    <Text style={[styles.userEmail, { color: cardTextColor }]}>{user.email}</Text>
                </View>

                <TouchableOpacity 
                    style={styles.signOutButton} 
                    onPress={signOut}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out-outline" size={24} color="#fff" />
                    <Text style={styles.signOutText}>Salir</Text>
                </TouchableOpacity>
            </View>

          ) : (
          
            <OptionCard onPress={signIn} iconName="logo-google" buttonColor="#DB4437">
              Iniciar Sesión con Google
            </OptionCard>
          )}

          <Text
            style={[
              styles.footer,
              { color: theme.mode === 'dark' ? '#ccc' : '#fff' },
            ]}
          >
            Personaliza tu experiencia y gestiona tu cuenta
          </Text>
        </View>
      </LinearGradient> );
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
   width: '100%',
  height: '100%',
 
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
    width: '100%',
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
  cardContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flex: 1,
  },
  cardIcon: {
    marginLeft: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
  },

  userInfoCard: {
    width: '85%',
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 20,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userInfoText: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 12,
    opacity: 0.7,
  },
  signOutButton: {
    backgroundColor: '#ff5c5c', 
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
  },
  footer: {
    fontSize: 14,
    marginTop: 20,
    opacity: 0.8,
  },
});