import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext'; // Asumo que tienes un hook para el tema

const Stack = createNativeStackNavigator();

// --- Pantalla de Inicio de Sesión (LoginScreen) ---
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const { theme } = useTheme(); // Obtener el tema

  const containerStyle = [styles.container, { backgroundColor: theme.colors.background }];
  const textInputStyle = [styles.input, { 
    backgroundColor: theme.mode === 'dark' ? '#333' : '#f0f0f0', 
    color: theme.colors.text,
    borderColor: theme.colors.border || '#ccc'
  }];

  return (
    <View style={containerStyle}>
      <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
        ¡Bienvenido! Primero debes iniciar sesión.
      </Text>

      <Text style={[styles.label, { color: theme.colors.text }]}>Correo Electrónico</Text>
      <TextInput
        style={textInputStyle}
        placeholder="email@ejemplo.com"
        placeholderTextColor={theme.colors.border || 'gray'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={[styles.label, { color: theme.colors.text }]}>Contraseña</Text>
      <TextInput
        style={textInputStyle}
        placeholder="********"
        placeholderTextColor={theme.colors.border || 'gray'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#e91e63' }]}
        onPress={() => signInWithEmail(email, password)}
      >
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>


      <Text style={[styles.divider, { color: theme.colors.text }]}>O</Text>

      {/* Botón de Google */}
      <TouchableOpacity 
        style={[styles.googleButton, { backgroundColor: '#4285F4' }]}
        onPress={signInWithGoogle}
      >
        <Ionicons name="logo-google" size={20} color="white" style={{ marginRight: 10 }} />
        <Text style={styles.googleButtonText}>Continuar con Google</Text>
      </TouchableOpacity>

      {/* Enlace a Registro */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>
          ¿No tienes cuenta? Regístrate aquí
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Pantalla de Registro (RegisterScreen) ---
function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { registerWithEmail, signInWithGoogle } = useAuth();
  const { theme } = useTheme();

  const containerStyle = [styles.container, { backgroundColor: theme.colors.background }];
  const textInputStyle = [styles.input, { 
    backgroundColor: theme.mode === 'dark' ? '#333' : '#f0f0f0', 
    color: theme.colors.text,
    borderColor: theme.colors.border || '#ccc'
  }];

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    registerWithEmail(email, password);
  };

  return (
    <View style={containerStyle}>
      <Text style={[styles.welcomeText, { color: theme.colors.text }]}>
        ¡Crea una cuenta para empezar!
      </Text>

      <Text style={[styles.label, { color: theme.colors.text }]}>Correo Electrónico</Text>
      <TextInput
        style={textInputStyle}
        placeholder="email@ejemplo.com"
        placeholderTextColor={theme.colors.border || 'gray'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={[styles.label, { color: theme.colors.text }]}>Contraseña</Text>
      <TextInput
        style={textInputStyle}
        placeholder="Crea una contraseña"
        placeholderTextColor={theme.colors.border || 'gray'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Text style={[styles.label, { color: theme.colors.text }]}>Confirmar Contraseña</Text>
      <TextInput
        style={textInputStyle}
        placeholder="Repite la contraseña"
        placeholderTextColor={theme.colors.border || 'gray'}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#e91e63' }]}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>

      <Text style={[styles.divider, { color: theme.colors.text }]}>O</Text>

      {/* Botón de Google */}
      <TouchableOpacity 
        style={[styles.googleButton, { backgroundColor: '#4285F4' }]}
        onPress={signInWithGoogle}
      >
        <Ionicons name="logo-google" size={20} color="white" style={{ marginRight: 10 }} />
        <Text style={styles.googleButtonText}>Continuar con Google</Text>
      </TouchableOpacity>

      {/* Enlace a Login */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>
          ¿Ya tienes cuenta? Inicia sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}


// --- Componente de Navegación de Autenticación ---
export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#e91e63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  googleButton: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  }
});