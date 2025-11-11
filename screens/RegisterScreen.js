import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = getAuth();

  const handleRegister = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => alert('Usuario registrado'))
      .catch((err) => alert(err.message));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput style={styles.input} placeholder="Correo" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry onChangeText={setPassword} />
      <Button title="Registrarse" onPress={handleRegister} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
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
