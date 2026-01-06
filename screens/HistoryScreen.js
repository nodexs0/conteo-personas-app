import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, 
  TouchableOpacity, Alert, Platform, FlatList, Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, PlusCircle, Trash, Video, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const STORAGE_KEY = '@reports_data';
const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const [reports, setReports] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        setReports(JSON.parse(jsonValue));
      } else {
        // Reportes iniciales si no hay nada guardado
        setReports([
          {
            id: 'rep_1',
            timestamp: new Date().toISOString(),
            count: 15,
            confidence: '0.85',
            imageUri: 'https://picsum.photos/seed/report1/400/300',
            status: 'Salón medio lleno',
          }
        ]);
      }
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

  const deleteReport = (id) => {
    const confirmDelete = () => {
      const updatedReports = reports.filter((r) => r.id !== id);
      saveReports(updatedReports);
    };

    if (Platform.OS === 'web') {
      if (confirm('¿Eliminar este reporte?')) confirmDelete();
    } else {
      Alert.alert('Eliminar', '¿Estás seguro de eliminar este reporte?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  const clearReports = () => {
    const confirmClear = () => saveReports([]);
    
    if (Platform.OS === 'web') {
      if (confirm('¿Eliminar TODOS los reportes?')) confirmClear();
    } else {
      Alert.alert('Limpiar Historial', 'Esta acción no se puede deshacer.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpiar Todo', style: 'destructive', onPress: confirmClear },
      ]);
    }
  };

  const createExampleReport = () => {
    const timestamp = new Date().toISOString();
    const newReport = {
      id: `rep_${Date.now()}`,
      timestamp,
      count: Math.floor(Math.random() * 30),
      confidence: (Math.random() * 0.5 + 0.5).toFixed(2),
      imageUri: `https://picsum.photos/seed/${Date.now()}/400/300`,
      status: 'Detección Manual',
    };
    saveReports([newReport, ...reports]);
  };

  const renderReportItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('Reporte', { reportId: item.id })}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
        <TouchableOpacity 
          style={styles.deleteIconButton} 
          onPress={() => deleteReport(item.id)}
        >
          <Trash2 size={18} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.dateText}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
          <Text style={styles.confidenceBadge}>
            {(parseFloat(item.confidence) * 100).toFixed(0)}% Conf.
          </Text>
        </View>

        <Text style={styles.cardStatus}>{item.status}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.countText}>Personas: {item.count}</Text>
          <ChevronRight size={20} color="#9f1342" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#921b1bff', '#b37e7eff']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={createExampleReport}>
            <PlusCircle size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.deleteBtn]} onPress={clearReports}>
            <Trash size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay reportes guardados.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={width > 768 ? 3 : 1}
          key={width > 768 ? 'h-web' : 'h-mobile'}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  headerButtons: { flexDirection: 'row', gap: 15 },
  iconButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  deleteBtn: { backgroundColor: 'rgba(220, 38, 38, 0.4)' },
  listContent: { padding: 15 },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    marginHorizontal: 10,
    flex: 1, // Para el grid en web
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  imageContainer: { position: 'relative' },
  cardImage: { width: '100%', height: 180, resizeMode: 'cover' },
  deleteIconButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#dc2626',
    padding: 8,
    borderRadius: 10,
  },
  cardContent: { padding: 15 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  dateText: { fontSize: 12, color: '#666' },
  confidenceBadge: { fontSize: 12, color: '#9f1342', fontWeight: 'bold' },
  cardStatus: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10
  },
  countText: { fontSize: 16, fontWeight: '600', color: '#555' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'white', fontSize: 16, opacity: 0.8 }
});