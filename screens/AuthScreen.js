import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  ImageBackground, ScrollView, KeyboardAvoidingView, Platform,
  useWindowDimensions, Image 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User, LogIn } from 'lucide-react-native';
import { useAuth } from '../AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email({ message: 'Email no válido' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Nombre muy corto' }),
  email: z.string().email({ message: 'Email no válido' }),
  password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
});

export default function AuthForm({ isLogin: initialMode }) {
  const [isLogin, setIsLogin] = useState(initialMode);
  const { signInWithEmail, registerWithEmail, signInWithGoogle } = useAuth();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const showSplitScreen = isWeb && width > 800;

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: { name: '', email: '', password: '' }
  });

  useEffect(() => { reset(); }, [isLogin]);

  const onSubmit = (data) => {
    isLogin ? signInWithEmail(data.email, data.password) : registerWithEmail(data.email, data.password, data.name);
  };

  return (
    <View style={styles.mainWrapper}>
      
      {/* 1. MITAD IZQUIERDA: COLOR SÓLIDO + IMAGEN (Solo en Web Grande) */}
      {showSplitScreen && (
        <View style={styles.leftPanel}>
          <Image 
            source={require('../assets/login.png')} 
            style={styles.sideImage}
            resizeMode="contain"
          />
          <Text style={styles.leftTitleText}>Bienvenido nuestra aplicación</Text>
          <Text style={styles.leftSubtitleText}>Accede a nuestra aplicacion desde la web.</Text>
        </View>
      )}

      {/* 2. MITAD DERECHA (O Pantalla completa en Móvil): IMAGEN DE FONDO */}
      <ImageBackground
        source={require('../assets/fondo1.jpg')}
        style={styles.rightPanel}
        imageStyle={{ opacity: showSplitScreen ? 0.2 : 0.4 }} // Menos opacidad en web para que el formulario resalte
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            
            <View style={[
              styles.card, 
              { width: showSplitScreen ? 420 : '100%', maxWidth: 500 },
              // En web usamos un fondo un poco más sólido para legibilidad
              { backgroundColor: showSplitScreen ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.92)' }
            ]}>
              
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {isLogin ? '¡Hola de nuevo!' : 'Bienvenido!'}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Inicia sesión' : 'Regístrate para comenzar'}
              </Text>

              {/* --- CAMPOS DEL FORMULARIO --- */}
              {!isLogin && (
                <View style={styles.inputWrapper}>
                  <User size={20} color="#666" style={styles.icon} />
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                      <TextInput 
                        style={[styles.input, { color: theme.colors.text }]} 
                        placeholder="Nombre Completo" 
                        value={value} 
                        onChangeText={onChange} 
                      />
                    )}
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Mail size={20} color="#666" style={styles.icon} />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <TextInput 
                      style={[styles.input, { color: theme.colors.text }]} 
                      placeholder="Correo Electrónico" 
                      value={value} 
                      onChangeText={onChange} 
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={20} color="#666" style={styles.icon} />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput 
                      style={[styles.input, { color: theme.colors.text }]} 
                      placeholder="Contraseña" 
                      secureTextEntry 
                      value={value} 
                      onChangeText={onChange} 
                    />
                  )}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </View>

              <TouchableOpacity 
                style={[styles.mainButton, { backgroundColor: '#9f1342' }]} 
                onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.buttonText}>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>
                <LogIn size={20} color="white" />
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.line} /><Text style={styles.dividerText}>O</Text><View style={styles.line} />
              </View>

              <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
                <View style={styles.googleContent}>
                  {/* Usamos Ionicons para el logo de Google */}
                  <Ionicons name="logo-google" size={20} color="#4285F4" style={{ marginRight: 10 }} />
                  <Text style={styles.googleButtonText}>Continuar con Google</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.footerLink}>
                <Text style={{ color: '#666', fontSize: 15 }}>
                  {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                  <Text style={{ color: '#9f1342', fontWeight: 'bold' }}>{isLogin ? 'Regístrate' : 'Inicia sesión'}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  // PANEL IZQUIERDO (ROJO SÓLIDO)
  leftPanel: {
    flex: 1,
    backgroundColor: '#a22651ff', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  sideImage: {
    width: '90%',
    height: 350,
    marginBottom: 30,
  },
  leftTitleText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  leftSubtitleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    textAlign: 'center',
    maxWidth: 400,
  },
  // PANEL DERECHO (IMAGEN FONDO1.JPG)
  rightPanel: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    alignItems: 'center',
  },
  card: {
    padding: 40,
    borderRadius: 28,
    // Sombra para Web
    ...Platform.select({
      web: {
        boxShadow: '0px 15px 35px rgba(0,0,0,0.15)',
      },
      default: {
        elevation: 5,
      }
    })
  },
  title: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  inputWrapper: { marginBottom: 18, width: '100%' },
  icon: { position: 'absolute', left: 15, top: 15, zIndex: 1 },
  input: {
    height: 52,
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    paddingLeft: 45,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
  },
  errorText: { color: '#dc2626', fontSize: 12, marginTop: 4, fontWeight: '500' },
  mainButton: {
    height: 55,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 12,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { marginHorizontal: 15, color: '#aaa', fontWeight: '600' },
  googleButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    marginTop: 5, // Un poco de espacio extra
  },
  googleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: { 
    color: '#444', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  footerLink: { marginTop: 30, alignItems: 'center' }
});