// screens/Report.js
import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../theme/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function ReportScreen() {
  const { theme } = useContext(ThemeContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { report } = route.params; // <- recibimos el reporte seleccionado

  const gradientColors =
    theme.mode === 'dark'
      ? ['#000000', '#1C1C1C', '#2E2E2E']
      : ['#420420ff', '#aa2477ff', '#832b58ff'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Regresar</Text>
        </TouchableOpacity>

        <Image
          source={
            report.imageUri
              ? { uri: report.imageUri }
              : require('../assets/reporte1.jpg')
          }
          style={styles.image}
        />

        <View style={styles.infoBox}>
          <Text style={[styles.title, { color: theme.mode === 'dark' ? '#fff' : '#222' }]}>
            Reporte ID: {report.id}
          </Text>

          <Text style={[styles.text, { color: theme.mode === 'dark' ? '#ccc' : '#333' }]}>
            Fecha: {new Date(report.timestamp).toLocaleString()}
          </Text>

          <Text style={[styles.text, { color: theme.mode === 'dark' ? '#ccc' : '#333' }]}>
            Personas detectadas: {report.count}
          </Text>

          {report.confidence && (
            <Text style={[styles.text, { color: theme.mode === 'dark' ? '#ccc' : '#333' }]}>
              Confianza: {report.confidence}
            </Text>
          )}

          <Text style={[styles.text, { color: theme.mode === 'dark' ? '#ccc' : '#333' }]}>
            Estado: {report.status}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { alignItems: 'center', padding: 20 },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    marginBottom: 20,
  },
  infoBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 16, marginBottom: 6 },
});
