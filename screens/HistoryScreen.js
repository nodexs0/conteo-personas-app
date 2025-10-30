import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clave usada para guardar los reportes
const STORAGE_KEY = '@reports_data';

export default function HistoryScreen() {
  const [reports, setReports] = useState([]);

  // Cargar reportes guardados al iniciar
  useEffect(() => {
    loadReports();
  }, []);

  // Cargar reportes desde AsyncStorage
  const loadReports = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        setReports(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error('Error cargando reportes', e);
    }
  };

  // Guardar reportes en AsyncStorage
  const saveReports = async (newReports) => {
    try {
      const jsonValue = JSON.stringify(newReports);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
      setReports(newReports);
    } catch (e) {
      console.error('Error guardando reportes', e);
    }
  };

  // Crear un reporte de ejemplo
  const createExampleReport = async () => {
    const timestamp = new Date().toISOString();
    const newReport = {
        id: `rep_${timestamp}`,
        timestamp,
        count: Math.floor(Math.random() * 30),
        confidence: (Math.random() * 0.5 + 0.5).toFixed(2),
        imageName: 'reporte1.jpg', // Solo el nombre
        status: 'Salón lleno',
    };


    const updatedReports = [newReport, ...reports];
    await saveReports(updatedReports);
    Alert.alert('Reporte creado', 'Se ha guardado un reporte de ejemplo.');
  };

  // Borrar todos los reportes
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

// Render
const renderItem = ({ item }) => (
  <View style={styles.card}>
    <Image
      source={item.imageName === 'reporte1.jpg' ? require('../assets/reporte1.jpg') : null}
      style={styles.image}
    />
    <View style={styles.info}>
      <Text style={styles.title}>Reporte ID: {item.id}</Text>
      <Text>Fecha: {new Date(item.timestamp).toLocaleString()}</Text>
      <Text>Personas detectadas: {item.count}</Text>
      <Text>Confianza: {item.confidence}</Text>
      <Text>Estado: {item.status}</Text>
    </View>
  </View>
);

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.addButton} onPress={createExampleReport}>
          <Text style={styles.buttonText}>Crear reporte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearReports}>
          <Text style={styles.buttonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      {reports.length === 0 ? (
        <Text style={styles.emptyText}>No hay reportes registrados aún.</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginRight: 5,
    alignItems: 'center',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#e53935',
    padding: 12,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  image: { width: 80, height: 80, borderRadius: 6, marginRight: 10 },
  info: { flex: 1 },
  title: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  emptyText: { textAlign: 'center', marginTop: 30, color: 'gray' },
  list: { paddingBottom: 20 },
});
