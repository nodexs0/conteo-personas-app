// screens/HistoryScreen.js
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../theme/ThemeContext';

// Clave usada para guardar los reportes
const STORAGE_KEY = '@reports_data';

export default function HistoryScreen() {
  const [reports, setReports] = useState([]);
  const { theme } = useContext(ThemeContext);
  useEffect(() => {
    loadReports();
  },
   []);
  const loadReports = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) setReports(JSON.parse(jsonValue));
    } catch (e) {
      console.error('Error cargando reportes', e);
    }
  };
  const saveReports = async (newReports) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
      setReports(newReports);
    } catch (e) {
      console.error('Error guardando reportes', e);
    }
  };

  const createExampleReport = async () => {
    const timestamp = new Date().toISOString();
    const newReport = {
      id: `rep_${timestamp}`,
      timestamp,
      count: Math.floor(Math.random() * 30),
      confidence: (Math.random() * 0.5 + 0.5).toFixed(2),
      imageName: 'reporte1.jpg',
      status: 'Salón lleno',
    };
    const updatedReports = [newReport, ...reports];
    await saveReports(updatedReports);
    Alert.alert('Reporte creado', 'Se ha guardado un reporte de ejemplo.');
  };

  const clearReports = async () => {
    Alert.alert('Confirmar', '¿Deseas eliminar todos los reportes?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setReports([]);
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            theme.mode === 'dark'
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(255,255,255,0.25)',
          borderColor:
            theme.mode === 'dark'
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(255,255,255,0.35)',
        },
      ]}
    >
      <Image
        source={
          item.imageName === 'reporte1.jpg'
            ? require('../assets/reporte1.jpg')
            : null
        }
        style={styles.image}
      />
      <View style={styles.info}>
        <Text
          style={[
            styles.title,
            { color: theme.mode === 'dark' ? '#fff' : '#222' },
          ]}
        >
          Reporte ID: {item.id}
        </Text>
        <Text style={{ color: theme.mode === 'dark' ? '#ccc' : '#333' }}>
          Fecha: {new Date(item.timestamp).toLocaleString()}
        </Text>
        <Text style={{ color: theme.mode === 'dark' ? '#ccc' : '#333' }}>
          Personas detectadas: {item.count}
        </Text>
        <Text style={{ color: theme.mode === 'dark' ? '#ccc' : '#333' }}>
          Confianza: {item.confidence}
        </Text>
        <Text style={{ color: theme.mode === 'dark' ? '#ccc' : '#333' }}>
          Estado: {item.status}
        </Text>
      </View>
    </View>
  );

  // Colores de fondo según modo
  const gradientColors =
    theme.mode === 'dark'
      ? ['#000000', '#1C1C1C', '#2E2E2E']
      : ['#420420ff', '#aa2477ff', '#832b58ff'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.addButton} onPress={createExampleReport}>
          <Text style={styles.buttonText}>Crear reporte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearReports}>
          <Text style={styles.buttonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      {reports.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.mode === 'dark' ? '#ccc' : '#fff' }]}>
          No hay reportes registrados aún.
        </Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#24aa2dff', // guinda/morado app
    padding: 14,
    borderRadius: 20,
    marginRight: 7,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#bb2e2eff', // azul oscuro
    padding: 14,
    borderRadius: 20,
    marginLeft: 7,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  card: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  image: { width: 80, height: 80, borderRadius: 10, marginRight: 12 },
  info: { flex: 1 },
  title: { fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  list: { paddingBottom: 30 },
});
