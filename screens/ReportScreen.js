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
  Percent, Hash, Save, Share2, Cloud,
  LogIn, LogOut, Timer
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

const generateHTML = async () => {
    const base64 = await getBase64Image(report.frame_final || report.imageUri);
    
    // Usamos tablas para el layout porque flexbox a veces falla en motores de impresión PDF antiguos
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Helvetica', Arial, sans-serif; background-color: #d47f00; }
            .wrapper { background-color: #d47f00; padding: 40px 0; min-height: 100vh; }
            .container { background-color: white; width: 85%; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
            .header { background-color: #f8f9fa; padding: 30px; border-bottom: 2px solid #eee; }
            .main-image { width: 100%; max-height: 350px; object-fit: cover; display: block; }
            .content { padding: 30px; background-color: white; }
            .section-title { color: #d47f00; font-size: 18px; font-weight: bold; border-bottom: 2px solid #ffcf8b; padding-bottom: 5px; margin-bottom: 15px; }
            
            /* Estilos de Tabla para columnas */
            .stats-table { width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 20px; }
            .stat-card { padding: 15px; border-radius: 12px; text-align: center; font-weight: bold; }
            .entry-bg { background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
            .exit-bg { background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
            .inside-bg { background-color: #fdf2f2; color: #9f1342; border: 1px solid #ffccbc; padding: 20px; margin-top: 10px; border-radius: 12px; text-align: center; font-weight: bold; }
            
            .info-text { font-size: 14px; color: #444; margin: 5px 0; }
            .label { color: #888; font-weight: bold; }
            .comment-box { background-color: #f5f5f5; padding: 15px; border-radius: 10px; border-left: 5px solid #d47f00; font-style: italic; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1 style="margin:0; color:#333; font-size: 24px;">Sesión de Monitoreo</h1>
                <p style="margin:5px 0; color:#666; font-size: 12px;">ID: ${report.session_id || report.id}</p>
              </div>

              ${base64 ? `<img src="data:image/jpeg;base64,${base64}" class="main-image" />` : ''}

              <div class="content">
                <div class="section-title">Detalles de Tiempo</div>
                <p class="info-text"><span class="label">Inicio:</span> ${new Date(report.inicio || report.timestamp).toLocaleString()}</p>
                <p class="info-text"><span class="label">Fin:</span> ${report.fin ? new Date(report.fin).toLocaleString() : 'Sesión Activa'}</p>
                <p class="info-text" style="margin-bottom:20px;"><span class="label">Duración:</span> ${report.duracion_segundos || 0} segundos</p>

                <div class="section-title">Flujo de Personas</div>
                <table class="stats-table">
                  <tr>
                    <td class="stat-card entry-bg">
                      <div style="font-size: 10px;">ENTRADAS</div>
                      <div style="font-size: 18px;">${report.entradas || 0}</div>
                    </td>
                    <td class="stat-card exit-bg">
                      <div style="font-size: 10px;">SALIDAS</div>
                      <div style="font-size: 18px;">${report.salidas || 0}</div>
                    </td>
                  </tr>
                </table>

                <div class="inside-bg">
                  Personas detectadas al final: ${report.personas_dentro || report.count}
                </div>

                <div class="section-title" style="margin-top:25px;">Notas y Observaciones</div>
                <div class="comment-box">
                  ${comment || 'No se ingresaron notas adicionales para este reporte.'}
                </div>
              </div>
            </div>
            <p style="text-align:center; color:white; font-size:10px; margin-top:20px;">Presence Pro - UPIIT | IPN</p>
          </div>
        </body>
      </html>
    `;
  };

  const saveReportToDrive = async () => {
    if (!googleAccessToken) {
      Alert.alert("Error", "No hay sesión de Google activa.");
      return;
    }
    setActionLoading(true);
    try {
      const htmlContent = await generateHTML();
      const { uri: localPdfUri } = await Print.printToFileAsync({ html: htmlContent, width: 595, height: 842 });
      const pdfBase64 = await FileSystem.readAsStringAsync(localPdfUri, { encoding: FileSystem.EncodingType.Base64 });

      const fileName = `Reporte_Sesion_${(report.session_id || report.id).substring(0,8)}.pdf`;
      const boundary = 'BoundaryDrivePDF';
      const metadata = JSON.stringify({ name: fileName, mimeType: 'application/pdf' });
      
      const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/pdf\r\nContent-Transfer-Encoding: base64\r\n\r\n${pdfBase64}\r\n--${boundary}--`;

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
        Alert.alert("Éxito", "PDF guardado en Drive", [
          { text: "Abrir", onPress: () => Linking.openURL(`https://drive.google.com/file/d/${data.id}/view`) }
        ]);
      } else { Alert.alert("Error", "La API de Drive rechazó el PDF."); }
    } catch (e) { Alert.alert("Error", "Fallo al conectar con Drive."); }
    finally { setActionLoading(false); }
  };

  const handleExportPDF = async () => {
    setActionLoading(true);
    try {
      const html = await generateHTML();
      const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
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
                <Text style={styles.cardTitle}>Sesión de Monitoreo</Text>
                <Text style={styles.cardDescription}>ID: {report.session_id || report.id}</Text>
              </View>
              <Hash color="#d47f00" size={28} />
            </View>

            <Image source={{ uri: report.frame_final || report.imageUri }} style={styles.image} />

            <View style={styles.cardContent}>
              <Text style={styles.sectionTitle}>Tiempos de Sesión</Text>
              <View style={styles.detailItem}>
                <Clock size={18} color="#666" />
                <View>
                  <Text style={styles.detailLabel}>Inicio / Fin</Text>
                  <Text style={styles.detailValue}>{new Date(report.inicio || report.timestamp).toLocaleString()}</Text>
                  {report.fin && <Text style={styles.detailValue}>{new Date(report.fin).toLocaleString()}</Text>}
                </View>
              </View>

              <View style={styles.detailItem}>
                <Timer size={18} color="#666" />
                <View>
                  <Text style={styles.detailLabel}>Duración Total</Text>
                  <Text style={styles.detailValue}>{report.duracion_segundos || 0} segundos</Text>
                </View>
              </View>

              <View style={styles.resultsRow}>
                <View style={[styles.resultBadge, { backgroundColor: '#e8f5e9' }]}>
                  <LogIn size={20} color="#2e7d32" />
                  <Text style={[styles.resultText, { color: '#2e7d32' }]}>{report.entradas || 0} Entradas</Text>
                </View>
                <View style={[styles.resultBadge, { backgroundColor: '#ffebee' }]}>
                  <LogOut size={20} color="#c62828" />
                  <Text style={[styles.resultText, { color: '#c62828' }]}>{report.salidas || 0} Salidas</Text>
                </View>
              </View>

              <View style={[styles.resultBadge, { marginBottom: 20, width: '100%', backgroundColor: '#fdf2f2' }]}>
                <User size={20} color="#9f1342" />
                <Text style={[styles.resultText, { color: '#9f1342' }]}>Personas en sitio: {report.personas_dentro || report.count}</Text>
              </View>

              <View style={styles.commentContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Observaciones de la sesión..."
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
                  {actionLoading ? <ActivityIndicator color="white" /> : (
                    <>
                      <Cloud size={16} color="white" />
                      <Text style={[styles.exportBtnText, {color: 'white'}]}>Drive</Text>
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
  center: { flex: 1, backgroundColor: '#d47f00', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 20, gap: 8 },
  backText: { color: 'white', fontWeight: 'bold' },
  card: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', elevation: 5 },
  cardHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9f9f9' },
  cardTitle: { fontSize: 20, fontWeight: 'bold' },
  cardDescription: { fontSize: 10, color: '#666' },
  image: { width: '100%', height: 250, resizeMode: 'cover' },
  cardContent: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  detailItem: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  detailLabel: { fontSize: 12, color: '#888' },
  detailValue: { fontSize: 14 },
  resultsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  resultBadge: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  resultText: { fontWeight: 'bold' },
  commentContainer: { marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#eee' },
  saveBtn: { backgroundColor: '#311B92', padding: 12, borderRadius: 8, marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
  exportRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  exportBtn: { flex: 1, backgroundColor: '#eee', padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  exportBtnText: { fontWeight: 'bold' }
});