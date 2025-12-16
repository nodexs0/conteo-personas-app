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
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../theme/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const STORAGE_KEY = '@reports_data';

export default function HistoryScreen() {
  const [reports, setReports] = useState([]);
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    loadReports();
  }, []);

  // Detectar foto desde CameraScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.photoUri) {
        createReportFromPhoto(route.params.photoUri);
        navigation.setParams({ photoUri: null });
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.photoUri]);

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

  const goToCamera = () => {
    navigation.navigate('Cámara');
  };

  // Crear reporte con foto
  const createReportFromPhoto = async (photoUri) => {
    const timestamp = new Date().toISOString();
    const newReport = {
      id: `rep_${timestamp}`,
      timestamp,
      count: Math.floor(Math.random() * 30),
      confidence: (Math.random() * 0.5 + 0.5).toFixed(2),
      imageUri: photoUri,
      status: 'Reporte con foto',
    };
    const updatedReports = [newReport, ...reports];
    await saveReports(updatedReports);
    Alert.alert('Reporte guardado', 'El reporte con foto se ha creado correctamente.');
  };

  // Crear reporte de ejemplo
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
    Alert.alert('Reporte de ejemplo creado');
  };

  // 🔥 LIMPIAR TODOS LOS REPORTES (compatible web)
  const clearReports = async () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('¿Deseas eliminar todos los reportes?');
      if (!ok) return;

      await AsyncStorage.removeItem(STORAGE_KEY);
      setReports([]);
      return;
    }

    // móvil
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

  // 🧨 ELIMINAR REPORTE INDIVIDUAL (compatible web)
  const deleteReport = async (id) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('¿Deseas eliminar este reporte?');
      if (!ok) return;

      const updatedReports = reports.filter((r) => r.id !== id);
      await saveReports(updatedReports);
      return;
    }

    // móvil
    Alert.alert('Eliminar reporte', '¿Deseas eliminar este reporte?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const updatedReports = reports.filter((r) => r.id !== id);
          await saveReports(updatedReports);
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
      {/* Ícono para eliminar */}
      <TouchableOpacity
        style={styles.deleteIcon}
        onPress={() => deleteReport(item.id)}
      >
        <Ionicons name="trash-outline" size={22} color="#d9534f" />
      </TouchableOpacity>

      {/* Contenido del card */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Reporte', { report: item })}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', flex: 1 }}
      >
        <Image
          source={
            item.imageUri
              ? { uri: item.imageUri }
              : require('../assets/reporte1.jpg')
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
            Descripción: {item.status}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const gradientColors =
    theme.mode === 'dark'
      ? ['#000000', '#1C1C1C', '#2E2E2E']
      : ['#651D32', '#651D32', '#832b4aff'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.addButton} onPress={createExampleReport}>
          <Text style={styles.buttonText}> Crear reporte</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearReports}>
          <Text style={styles.buttonText}> Limpiar</Text>
        </TouchableOpacity>
      </View>

      {reports.length === 0 ? (
        <Text
          style={[
            styles.emptyText,
            { color: theme.mode === 'dark' ? '#ccc' : '#fff' },
          ]}
        >
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
    backgroundColor: '#24aa2dff',
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
    backgroundColor: '#bb2e2eff',
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
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
  },
  deleteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 5,
  },
  image: { width: 80, height: 80, borderRadius: 10, marginRight: 12 },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  list: { paddingBottom: 30 },
});
