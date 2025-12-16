import React, { useContext } from 'react';
// Nuevas Importaciones: Alert, Linking, y ScrollView (ya estaba)
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Linking 
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../theme/ThemeContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../AuthContext'; 


export default function ReportScreen() {
  const { theme } = useContext(ThemeContext);
  const { googleAccessToken } = useContext(AuthContext); 
  const route = useRoute();
  const navigation = useNavigation();
  const { report } = route.params;

  // Función auxiliar para obtener Base64
  const getBase64Image = async (uri) => {
    // Verifica si la URI es un archivo local (startsWith('file://'))
    if (uri && uri.startsWith('file://')) {
      try {
        return await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (e) {
        console.warn("No se pudo leer la imagen local. ¿El archivo existe?", e);
        return null; // Devuelve null si falla la lectura
      }
    }
    return null;
  };
  

  // 1. Nueva función para generar el contenido HTML del reporte
  const generateReportHTML = (report, base64Image) => {
      const formattedDate = new Date(report.timestamp).toLocaleString();
      const imageSource = base64Image 
        ? `data:image/jpeg;base64,${base64Image}` 
        // Si no hay Base64, la imagen no se incrustará. 
        : ''; 

      return `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Reporte de Conteo ID: ${report.id}</title>
      <style>
          /* (Estilos CSS omitidos para brevedad, asumo que son correctos) */
          body { font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f9; }
          .container { max-width: 800px; margin: 0 auto; background-color: #fff; padding: 25px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          h1 { color: #420420; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #651D32; color: white; }
          .report-image { max-width: 100%; height: auto; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
          .status-text { margin-top: 15px; font-weight: bold; font-size: 1.1em; }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>Informe de Detección de Personas</h1>
          <table>
              <thead>
                  <tr><th>Detalle</th><th>Valor</th></tr>
              </thead>
              <tbody>
                  <tr><td>ID del Reporte</td><td>${report.id}</td></tr>
                  <tr><td>Fecha y Hora</td><td>${formattedDate}</td></tr>
                  <tr><td>Personas Detectadas</td><td>${report.count}</td></tr>
                  <tr><td>Confianza de Detección</td><td>${report.confidence || 'N/A'}</td></tr>
                  <tr><td>Descripción / Estado</td><td>${report.status}</td></tr>
              </tbody>
          </table>

          <p class="status-text">Estado: ${report.status}</p>

          ${base64Image ? `
              <h2>Imagen Capturada</h2>
              <img src="${imageSource}" alt="Imagen del Reporte" class="report-image">
          ` : '<h2>No se adjuntó imagen local al reporte.</h2>'}
      </div>
  </body>
  </html>
      `;
  };

  // 2. Función principal para subir el archivo a Google Drive
  const saveReportToDrive = async () => {
      if (!googleAccessToken) {
          Alert.alert("Error", "Necesitas iniciar sesión con Google para guardar en Drive.");
          return;
      }
      
      // Paso 1: Obtener la imagen en Base64
      const base64Image = await getBase64Image(report.imageUri);

      // Paso 2: Generar el contenido HTML
      const fileContent = generateReportHTML(report, base64Image);
      const fileName = `Reporte_${new Date(report.timestamp).toLocaleDateString().replace(/\//g, '-')}_${report.count}.html`;

      try {
          // Paso 3: Subir a Google Drive
          const boundary = 'ConteoAppBoundary';
          const metadata = {
              name: fileName,
              mimeType: 'text/html', 
          };

          const body = 
              `--${boundary}\r\n` +
              `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
              `${JSON.stringify(metadata)}\r\n` +
              `--${boundary}\r\n` +
              `Content-Type: text/html\r\n\r\n` +
              `${fileContent}\r\n` +
              `--${boundary}--\r\n`;

          const response = await fetch(
              'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
              {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${googleAccessToken}`,
                      'Content-Type': `multipart/related; boundary=${boundary}`,
                  },
                  body: body,
              }
          );

          if (response.ok) {
              const result = await response.json();
              Alert.alert(
                  '¡Reporte Guardado!', 
                  `El informe HTML ha sido subido a Google Drive.`,
                  [{ 
                      text: 'Abrir en Drive', 
                      onPress: () => Linking.openURL(`https://drive.google.com/file/d/${result.id}/view`) 
                  }]
              );
          } else {
              // ⬅️ Diagnóstico crucial: Imprimir la respuesta de error completa
              const errorJson = await response.json();
              console.error('Error de Drive (JSON):', errorJson);
              let errorMessage = `Fallo al guardar en Drive: ${response.status}`;
              if (errorJson.error && errorJson.error.message) {
                  errorMessage += `\nDetalle: ${errorJson.error.message}`;
              }
              Alert.alert('Error', errorMessage);
          }

      } catch (e) {
          console.error('Error de red/petición al subir a Drive', e);
          Alert.alert('Error', 'Ocurrió un error de red o de código al subir el archivo.');
      }
  }

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
        
        {/* NUEVO BOTÓN PARA GUARDAR EN DRIVE */}
        <TouchableOpacity 
          style={styles.driveButton} 
          onPress={saveReportToDrive}
          activeOpacity={0.8}
        >
          <Text style={styles.driveButtonText}>Guardar en Google Drive</Text>
        </TouchableOpacity>

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
  //  NUEVOS ESTILOS PARA EL BOTÓN DE DRIVE
  driveButton: {
    backgroundColor: '#4285F4', // Azul de Google
    padding: 15,
    borderRadius: 20,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  driveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});