import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [personCount, setPersonCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [boxes, setBoxes] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const isWeb = Platform.OS === 'web';

  // Esperar que el modelo cargue
  useEffect(() => {
    const timer = setTimeout(() => setIsModelLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Inicializa cámara web
  useEffect(() => {
    if (isWeb) {
      const initWebCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.error('No se pudo acceder a la cámara web:', err);
          Alert.alert('Error', 'No se pudo acceder a la cámara web');
        }
      };
      initWebCamera();
    }
  }, [isWeb]);

  // Maneja la detección continua esperando que termine cada ciclo
  useEffect(() => {
    let isActive = true;

    const startDetectionLoop = async () => {
      while (isDetecting && isActive) {
        await detectPersons();
        // Esperar 2 segundos antes de la siguiente detección
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    };

    if (isDetecting) {
      startDetectionLoop();
    }

    return () => {
      isActive = false;
    };
  }, [isDetecting]);

  useFocusEffect(
    useCallback(() => {
      // Cuando la pantalla está enfocada, no hacemos nada especial
      return () => {
        // Cuando la pantalla pierde foco, detenemos la detección
        setIsDetecting(false);
      };
    }, [])
  );

  if (!permission && !isWeb) return <View><Text>Cargando...</Text></View>;

  if (!permission?.granted && !isWeb)
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos tu permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );

  const toggleCameraFacing = () => setFacing(facing === 'back' ? 'front' : 'back');
  const toggleFlash = () => setFlash(flash === 'off' ? 'on' : 'off');

  const captureWebFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.6);
    });
  };

  const detectPersons = async () => {
    if (isProcessing || isModelLoading) return;

    try {
      setIsProcessing(true);
      let file, photo;

      if (isWeb) {
        const blob = await captureWebFrame();
        if (!blob) throw new Error('No se pudo capturar el frame');
        file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
      } else {
        photo = await cameraRef.current.takePictureAsync({ quality: 0.6, skipProcessing: Platform.OS === 'android' });
        file = { uri: photo.uri, type: 'image/jpeg', name: 'photo.jpg' };
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://192.168.1.68:8000/predict/person', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (response.data?.persons) {
        const persons = response.data.persons;

        const imgWidth = isWeb ? videoRef.current.videoWidth : photo.width;
        const imgHeight = isWeb ? videoRef.current.videoHeight : photo.height;

        const scaleX = screenWidth / imgWidth;
        const scaleY = screenHeight / imgHeight;

        const convertedBoxes = persons.map(p => {
          const [x1, y1, x2, y2] = p.bbox;
          return {
            x: x1 * scaleX,
            y: y1 * scaleY,
            width: (x2 - x1) * scaleX,
            height: (y2 - y1) * scaleY,
            score: p.score,
          };
        });

        setBoxes(convertedBoxes);
        setPersonCount(response.data.person_count);
      } else {
        console.log('No se recibieron datos de personas del servidor');
        Alert.alert('Error', 'Error en la detección de personas, inténtalo de nuevo.');
      }
    } catch (err) {
      console.log('Error detectando personas:', err);
      if (err.message.includes('Network Error') || err.message.includes('AxiosError')) {
        console.log('Error de red: Verifica que el servidor esté corriendo y accesible.');
      } else {
        Alert.alert('Error', 'No se pudo detectar personas: ' + err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const goToDoorDetectionWeb = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      navigation.navigate('DoorDetection', { photoUri: url, isWeb: true });
    }, 'image/jpeg', 0.8);
  };

  return (
    <View style={styles.container}>
      {isWeb ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      ) : (
        <CameraView style={StyleSheet.absoluteFill} facing={facing} flash={flash} ref={cameraRef} />
      )}

      {boxes.map((box, index) => (
        <View
          key={index}
          style={[styles.boundingBox, { left: box.x, top: box.y, width: box.width, height: box.height }]}
        >
          <Text style={styles.boxLabel}>{(box.score * 100).toFixed(1)}%</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Tabs', { screen: 'Inicio' })}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {!isWeb && (
        <>
          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Ionicons name={flash === 'off' ? 'flash-off' : 'flash'} size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleCamera} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.doorButton}
        onPress={isWeb ? goToDoorDetectionWeb : async () => {
          if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: Platform.OS === 'android', exif: false });
            navigation.navigate('DoorDetection', { photoUri: photo.uri });
          }
        }}
        disabled={isProcessing || isModelLoading}
      >
        <MaterialCommunityIcons name="door" size={24} color="white" />
      </TouchableOpacity>

      {/* Botón para iniciar/detener detección */}
      <TouchableOpacity
        style={[styles.captureButton, (isProcessing || isModelLoading) && { backgroundColor: '#777' }]}
        onPress={() => setIsDetecting(!isDetecting)}
        disabled={isProcessing || isModelLoading}
      >
        <Ionicons name="camera" size={24} color="white" />
        <Text style={styles.buttonText}>
          {isModelLoading
            ? 'Cargando modelo...'
            : isProcessing
            ? 'Procesando...'
            : isDetecting
            ? 'Detener detección'
            : 'Iniciar detección'}
        </Text>
      </TouchableOpacity>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>Hay {personCount} personas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  video: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' },
  captureButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  countContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 25,
  },
  countText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  backButton: { position: 'absolute', top: 40, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  flashButton: { position: 'absolute', top: 100, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  toggleCamera: { position: 'absolute', top: 160, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  doorButton: { position: 'absolute', top: 220, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  boundingBox: { position: 'absolute', borderWidth: 2, borderColor: '#00FF00', backgroundColor: 'rgba(0,255,0,0.1)', zIndex: 10, pointerEvents: 'none' },
  boxLabel: { color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', fontSize: 10, position: 'absolute', bottom: 0, left: 0, paddingHorizontal: 2 },
  message: { textAlign: 'center', paddingBottom: 10 },
  permissionButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignSelf: 'center' },
  permissionText: { color: '#fff', fontSize: 16 },
});
