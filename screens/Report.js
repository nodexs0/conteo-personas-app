import React, { useContext, useState, useEffect } from 'react';
import { 
  View, Text, Image, StyleSheet, TouchableOpacity, 
  ScrollView, Alert, Linking, TextInput, ActivityIndicator, Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { 
  ArrowLeft, FileText, User, Clock, 
  Percent, Info, Save, Share2, Cloud
} from 'lucide-react-native';

import { ThemeContext } from '../theme/ThemeContext';
import { AuthContext } from '../AuthContext'; 

const STORAGE_KEY = '@reports_data';

export default function ReportScreen({ route, navigation }) {
  const { theme } = useContext(ThemeContext);
  const { googleAccessToken } = useContext(AuthContext);
  const { reportId } = route.params;

  const [report, setReport] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        const reports = JSON.parse(jsonValue);
        const found = reports.find((r) => r.id === reportId);
        if (found) {
          setReport(found);
          setComment(found.comment || '');
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const saveComment = async () => {
    setActionLoading(true);
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      const reports = JSON.parse(jsonValue);
      const index = reports.findIndex((r) => r.id === reportId);
      reports[index].comment = comment;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      Alert.alert("Éxito", "Comentario guardado localmente.");
    } catch (e) { Alert.alert("Error", "No se pudo guardar."); }
    finally { setActionLoading(false); }
  };

  // --- Lógica Interna de Drive ---
  const getBase64Image = async (uri) => {
    if (uri && uri.startsWith('file://')) {
      try {
        return await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (e) { return null; }
    }
    return null;
  };

  const saveReportToDrive = async () => {
    if (!googleAccessToken) {
      Alert.alert("Error", "No hay sesión de Google activa.");
      return;
    }
    setActionLoading(true);
    try {
      const base64Image = await getBase64Image(report.imageUri);
      const fileName = `Reporte_${report.id.substring(0,8)}.html`;
      
      const htmlContent = `
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h1 style="color: #311B92;">Reporte</h1>
            <p><strong>ID:</strong> ${report.id}</p>
            <p><strong>Fecha:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>Personas:</strong> ${report.count}</p>
            <p><strong>Notas:</strong> ${comment || 'Sin comentarios'}</p>
            ${base64Image ? `<img src="data:image/jpeg;base64,${base64Image}" style="width:100%; border-radius:10px;"/>` : ''}
          </body>
        </html>`;

      const boundary = 'BoundaryDrive';
      const metadata = JSON.stringify({ name: fileName, mimeType: 'text/html' });
      const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: text/html\r\n\r\n${htmlContent}\r\n--${boundary}--`;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert("Éxito", "Guardado en Drive", [
          { text: "Abrir", onPress: () => Linking.openURL(`https://drive.google.com/file/d/${data.id}/view`) }
        ]);
      } else {
        Alert.alert("Error", "La API de Google rechazó la subida.");
      }
    } catch (e) {
      Alert.alert("Error", "Fallo al conectar con Drive.");
    } finally { setActionLoading(false); }
  };

  const handleExportPDF = async () => {
    setActionLoading(true);
    try {
      const base64 = await getBase64Image(report.imageUri);
      const html = `<html><body style="padding:40px;"><h1>Informe</h1><p>${report.id}</p>${base64 ? `<img src="data:image/jpeg;base64,${base64}" style="width:100%"/>`:''}</body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error", "Fallo al generar PDF."); }
    finally { setActionLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>;

  return (
    <View style={styles.mainWrapper}>
      <LinearGradient colors={['#d47f00ff', '#ffcf8bff']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color="white" size={16} />
            <Text style={styles.backText}>Volver al Historial</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Informe de Detección</Text>
                <Text style={styles.cardDescription}>ID: {report.id}</Text>
              </View>
              <FileText color="#9f1342" size={28} />
            </View>

            <Image source={{ uri: report.imageUri }} style={styles.image} />

            <View style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Detalles del Análisis</Text>
              <View style={styles.detailItem}>
                <Clock size={18} color="#666" />
                <View>
                  <Text style={styles.detailLabel}>Fecha y Hora</Text>
                  <Text style={styles.detailValue}>{new Date(report.timestamp).toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.resultsRow}>
                <View style={styles.resultBadge}>
                  <User size={20} color="#9f1342" />
                  <Text style={styles.resultText}>{report.count} Personas</Text>
                </View>
                <View style={styles.resultBadge}>
                  <Percent size={20} color="#9f1342" />
                  <Text style={styles.resultText}>{(parseFloat(report.confidence)*100).toFixed(0)}%</Text>
                </View>
              </View>

              <View style={styles.commentContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Escribe una observación..."
                  multiline
                  value={comment}
                  onChangeText={setComment}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={saveComment}>
                  <Save size={16} color="white" />
                  <Text style={styles.btnText}>Guardar Notas</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.exportRow}>
                <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
                  <Share2 size={16} color="#333" />
                  <Text style={styles.exportBtnText}>PDF</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.exportBtn, {backgroundColor: '#4285F4'}]} 
                  onPress={saveReportToDrive}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Cloud size={16} color="white" />
                      <Text style={[styles.exportBtnText, {color: 'white'}]}>Google Drive</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  container: { flex: 1 },
  center: { flex: 1, backgroundColor: '#311B92', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 20, gap: 8 },
  backText: { color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden' },
  cardHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9f9f9' },
  cardTitle: { fontSize: 20, fontWeight: 'bold' },
  cardDescription: { fontSize: 10, color: '#666' },
  image: { width: '100%', height: 250 },
  cardContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  detailItem: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  detailLabel: { fontSize: 12, color: '#888' },
  detailValue: { fontSize: 14 },
  resultsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  resultBadge: { flex: 1, backgroundColor: '#fdf2f2', padding: 15, borderRadius: 12, alignItems: 'center' },
  resultText: { fontWeight: 'bold', color: '#9f1342' },
  commentContainer: { marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#311B92', padding: 12, borderRadius: 8, marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
  exportRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  exportBtn: { flex: 1, backgroundColor: '#eee', padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  exportBtnText: { fontWeight: 'bold' }
});