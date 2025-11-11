import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = getAuth();

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => console.log("Usuario logueado"))
      .catch((err) => alert(err.message));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput style={styles.input} placeholder="Correo" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry onChangeText={setPassword} />
      <Button title="Entrar" onPress={handleLogin} />
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, marginVertical: 8 },
  link: { color: '#007BFF', marginTop: 10 },
});
