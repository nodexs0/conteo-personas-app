import React, { useState, useRef, useEffect, useMemo  } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
  PanResponder
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';


export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [personCount, setPersonCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [boxes, setBoxes] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const STORAGE_KEY = '@reports_data';
  
  // Estados para tracking
  const [isTracking, setIsTracking] = useState(false);
  const [trackingSessionId, setTrackingSessionId] = useState(null);
  const [trackingStats, setTrackingStats] = useState({
    entradas: 0,
    salidas: 0,
    personas_dentro: 0,
  });
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [frameCounter, setFrameCounter] = useState(0);

  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const trackingIntervalRef = useRef(null);

  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';

  // === PUERTAS ===
  const [doorBoxes, setDoorBoxes] = useState([]);          // para dibujar
  const [doorCoordsRaw, setDoorCoordsRaw] = useState(null); // para tracking (coords originales)
  const [isDrawingDoor, setIsDrawingDoor] = useState(false);
  const [doorStart, setDoorStart] = useState(null);
  const [doorPreviewBox, setDoorPreviewBox] = useState(null);


  // URL del servidor
  const SERVER_URL = 'http://192.168.0.12:8000';

  // Cargar estado inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsModelLoading(false), 2000);
    return () => {
      clearTimeout(timer);
      stopDetection();
      stopTracking();
    };
  }, []);

  // Inicializar cámara web
  useEffect(() => {
    if (isWeb) {
      const initWebCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
          });
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.error('No se pudo acceder a la cámara web:', err);
          Alert.alert('Error', 'No se pudo acceder a la cámara web');
        }
      };
      initWebCamera();
    }
  }, [isWeb]);

  // Limpiar al salir de la pantalla
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopDetection();
        stopTracking();
      };
    }, [])
  );

 const doorPanResponder = useMemo(
  () =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        if (!isDrawingDoor) return;

        const { locationX, locationY } = evt.nativeEvent;
        setDoorStart({ x: locationX, y: locationY });
        setDoorPreviewBox(null);
      },

      onPanResponderMove: (evt) => {
        if (!doorStart) return;

        const { locationX, locationY } = evt.nativeEvent;

        setDoorPreviewBox({
          x: Math.min(doorStart.x, locationX),
          y: Math.min(doorStart.y, locationY),
          width: Math.abs(locationX - doorStart.x),
          height: Math.abs(locationY - doorStart.y),
        });
      },

      onPanResponderRelease: () => {
        if (!doorPreviewBox) {
          setIsDrawingDoor(false);
          return;
        }

        setDoorBoxes([doorPreviewBox]);
        setIsDrawingDoor(false);
        setDoorStart(null);
      },
    }),
  [isDrawingDoor, doorStart, doorPreviewBox]
);



  // =================== DETECCIÓN NORMAL (personas) ===================
  const captureWebFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) return null;

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
      let file;

      if (isWeb) {
        const blob = await captureWebFrame();
        if (!blob) throw new Error('No se pudo capturar el frame');
        file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
      } else {
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.6, 
          skipProcessing: Platform.OS === 'android',
          exif: false
        });
        file = { 
          uri: photo.uri, 
          type: 'image/jpeg', 
          name: 'photo.jpg' 
        };
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${SERVER_URL}/predict/persons`, 
        formData, 
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10000
        }
      );

      if (response.data?.persons) {
        const persons = response.data.persons;
        
        // Calcular dimensiones para escalar los bounding boxes
        let imgWidth = 1920;
        let imgHeight = 1080;
        
        if (isWeb && videoRef.current) {
          imgWidth = videoRef.current.videoWidth;
          imgHeight = videoRef.current.videoHeight;
        }

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
            color: '#00FF00',
          };
        });

        setBoxes(convertedBoxes);
        setPersonCount(response.data.person_count);
      } else {
        setBoxes([]);
        setPersonCount(0);
      }
    } catch (err) {
      console.log('Error detectando personas:', err);
      setBoxes([]);
      setPersonCount(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const startDetection = () => {
    setIsDetecting(true);
    detectionIntervalRef.current = setInterval(async () => {
      if (!isProcessing) {
        await detectPersons();
      }
    }, 2000);
  };

  const stopDetection = () => {
    setIsDetecting(false);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setBoxes([]);
    setPersonCount(0);
  };

  // =================== TRACKING ===================
  const startTrackingSession = async () => {
    try {
      setIsProcessing(true);
      const door = doorCoordsRaw ?? {
        x1: 106,
        y1: 258,
        x2: 396,
        y2: 819,
      };



      // Iniciar sesión de tracking
      const response = await axios.post(
        `${SERVER_URL}/predict/tracking/session/start`,
        {},
        {
          params: {
            door_x1: Math.round(door.x1),
            door_y1: Math.round(door.y1),
            door_x2: Math.round(door.x2),
            door_y2: Math.round(door.y2),
            detect_interval: 5,
            disappear_buffer: 10
          },
          timeout: 5000
        }
      );

      if (response.data.success && response.data.session_id) {
        const sessionId = response.data.session_id;
        setTrackingSessionId(sessionId);
        setIsTracking(true);
        setShowTrackingModal(true);
        setFrameCounter(0);
        setTrackingStats({
          entradas: 0,
          salidas: 0,
          personas_dentro: 0,
        });
        
        // Iniciar envío de frames
        startSendingFrames(sessionId);
      }
    } catch (err) {
      console.log('Error iniciando tracking:', err);
      Alert.alert('Error', 'No se pudo iniciar el tracking');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAndStoreReport = async ({ imageUri, stats }) => {
    const report = {
      id: Crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      count: stats.personas_dentro,
      entradas: stats.entradas,
      salidas: stats.salidas,
      confidence: 1, // fijo o calculado si quieres
      imageUri,
      comment: ''
    };

    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    const reports = jsonValue ? JSON.parse(jsonValue) : [];

    reports.unshift(report);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reports));

    return report.id;
  };

  const stopTracking = async () => {
  console.log('Deteniendo tracking...');
  setIsProcessing(true);

  // Detener intervalos INMEDIATO
  if (trackingIntervalRef.current) {
    clearInterval(trackingIntervalRef.current);
    trackingIntervalRef.current = null;
  }

  if (detectionIntervalRef.current) {
    clearInterval(detectionIntervalRef.current);
    detectionIntervalRef.current = null;
  }

  const currentSessionId = trackingSessionId;
  const finalStats = { ...trackingStats }; //congelar datos

  let imageUri = null;

  //CAPTURAR ÚLTIMO FRAME
  try {
    if (isWeb) {
      const blob = await captureWebFrame();
      if (blob) {
        imageUri = URL.createObjectURL(blob);
      }
    } else {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });
      imageUri = photo.uri;
    }
  } catch (e) {
    console.log('No se pudo capturar frame final');
  }

  //GENERAR + GUARDAR REPORTE
  let reportId = null;
  try {
    reportId = await generateAndStoreReport({
      imageUri,
      stats: finalStats,
    });
  } catch (e) {
    console.log('Error guardando reporte', e);
  }

  //LIMPIAR ESTADOS LOCALES
  setIsTracking(false);
  setTrackingSessionId(null);
  setDoorBoxes([]);
  setDoorCoordsRaw(null);
  setTrackingStats({ entradas: 0, salidas: 0, personas_dentro: 0 });
  setBoxes([]);
  setFrameCounter(0);
  setIsDetecting(false);
  setShowTrackingModal(false);

  //NAVEGAR A ReportScreen
  if (reportId) {
    navigation.navigate('ReportScreen', { reportId });
  }

  //CERRAR SESIÓN BACKEND
  if (currentSessionId) {
    try {
      await axios.delete(
        `${SERVER_URL}/predict/tracking/session/${currentSessionId}`,
        { timeout: 1500 }
      );
    } catch {}
  }

  setIsProcessing(false);
  console.log('Tracking detenido completamente');
};

  const finalizeTracking = async (sessionId) => {
  try {
    let file;

    // Capturar último frame
    if (isWeb) {
      const blob = await captureWebFrame();
      if (!blob) return;
      file = new File([blob], 'final_frame.jpg', { type: 'image/jpeg' });
    } else {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
        exif: false
      });
      file = {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'final_frame.jpg'
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    await axios.post(
      `${SERVER_URL}/predict/tracking/session/${sessionId}/finalize`,
      formData,
      {
        params: {
          entradas: trackingStats.entradas,
          salidas: trackingStats.salidas,
          personas_dentro: trackingStats.personas_dentro,
          final_timestamp: new Date().toISOString()
        },
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5000
      }
    );

    console.log('Reporte final enviado');
  } catch (err) {
    console.log('Error enviando reporte final:', err);
  }
};


  const startSendingFrames = (sessionId) => {
    let frameNumber = 0;
    
    trackingIntervalRef.current = setInterval(async () => {
      if (isProcessing) return;
      
      try {
        setIsProcessing(true);
        frameNumber++;
        setFrameCounter(frameNumber);
        
        let file;
        
        if (isWeb) {
          const blob = await captureWebFrame();
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          file = new File([blob], `frame_${frameNumber}.jpg`, { type: 'image/jpeg' });
        } else {
          const photo = await cameraRef.current.takePictureAsync({ 
            quality: 0.5,
            skipProcessing: true,
            exif: false
          });
          file = { 
            uri: photo.uri, 
            type: 'image/jpeg', 
            name: `frame_${frameNumber}.jpg` 
          };
        }

        const formData = new FormData();
        formData.append('file', file);

        const forceDetection = frameNumber % 1 === 0;
        
        const response = await axios.post(
          `${SERVER_URL}/predict/tracking/frame`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            params: {
              session_id: sessionId,
              force_detection: forceDetection
            },
            timeout: 5000
          }
        );

        // Actualizar estadísticas
        if (response.data?.statistics) {
          setTrackingStats({
            entradas: response.data.statistics.entradas_acumuladas,
            salidas: response.data.statistics.salidas_acumuladas,
            personas_dentro: response.data.statistics.personas_dentro_actual,
          });
        }

        // Actualizar bounding boxes
        if (response.data?.current_detections) {
          const detections = response.data.current_detections;
          
          const imgWidth = isWeb ? (videoRef.current?.videoWidth || 1920) : 1920;
          const imgHeight = isWeb ? (videoRef.current?.videoHeight || 1080) : 1080;
          
          const scaleX = screenWidth / imgWidth;
          const scaleY = screenHeight / imgHeight;
          
          const convertedBoxes = detections.map(det => {
            const [x1, y1, x2, y2] = det.bbox;
            return {
              x: x1 * scaleX,
              y: y1 * scaleY,
              width: (x2 - x1) * scaleX,
              height: (y2 - y1) * scaleY,
              trackId: det.track_id,
              inDoor: det.in_door,
              color: det.in_door ? '#00FF00' : '#FF0000',
              score: 0.9,
            };
          });
          
          setBoxes(convertedBoxes);
        }
        
      } catch (err) {
        console.log('Error enviando frame:', err);
        if (err.response?.status === 404 || err.message.includes('session')) {
          Alert.alert('Sesión expirada', 'La sesión de tracking ha expirado');
          stopTracking();
        }
      } finally {
        setIsProcessing(false);
      }
    }, 1000);
  };

  // =================== FUNCIONES AUXILIARES ===================
  const toggleCameraFacing = () => setFacing(facing === 'back' ? 'front' : 'back');
  const toggleFlash = () => setFlash(flash === 'off' ? 'on' : 'off');

const detectDoors = async () => {
  if (isProcessing || isTracking) return;

  try {
    setIsProcessing(true);

    let file;
    let imgWidth = 1920;
    let imgHeight = 1080;

    if (isWeb) {
      const blob = await captureWebFrame();
      if (!blob) throw new Error('No frame');
      file = new File([blob], 'doors.jpg', { type: 'image/jpeg' });

      imgWidth = videoRef.current.videoWidth;
      imgHeight = videoRef.current.videoHeight;
    } else {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
        exif: false
      });
      file = {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'doors.jpg'
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${SERVER_URL}/predict/doors`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    if (!response.data?.doors?.length) {
      Alert.alert('Puertas', 'No se detectaron puertas');
      setDoorBoxes([]);
      setDoorCoordsRaw(null);
      return;
    }

    // Tomamos LA PUERTA MÁS GRANDE (criterio típico)
    const doors = response.data.doors;
    const mainDoor = doors.reduce((a, b) => {
      const areaA = (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]);
      const areaB = (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]);
      return areaB > areaA ? b : a;
    });

    const [x1, y1, x2, y2] = mainDoor.bbox;

    // Guardar COORDENADAS CRUDAS (BACKEND)
    setDoorCoordsRaw({ x1, y1, x2, y2 });

    // Escalar para dibujar
    const scaleX = screenWidth / imgWidth;
    const scaleY = screenHeight / imgHeight;

    setDoorBoxes([{
      x: x1 * scaleX,
      y: y1 * scaleY,
      width: (x2 - x1) * scaleX,
      height: (y2 - y1) * scaleY,
      color: '#00BFFF'
    }]);

    Alert.alert('Puerta detectada', 'Puerta guardada para tracking');

  } catch (err) {
    console.log('Error detectando puertas:', err);
    Alert.alert('Error', 'No se pudo detectar la puerta');
  } finally {
    setIsProcessing(false);
  }
};


  // =================== RENDER ===================
  if (!permission && !isWeb) {
    return (
      <View
      style={styles.container}></View>
    );
  }

  if (!permission?.granted && !isWeb) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Necesitamos tu permiso para usar la cámara
      </Text>
      <TouchableOpacity
        style={styles.permissionButton}
        onPress={requestPermission}
      >
        <Text style={styles.permissionText}>Conceder Permiso</Text>
      </TouchableOpacity>
    </View>
  );
  }

  return (
    <View style={styles.container}>
      {/* Vista de cámara */}
      {isWeb ? (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={styles.video} 
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      ) : (
        <CameraView 
          style={StyleSheet.absoluteFill} 
          facing={facing} 
          flash={flash} 
          ref={cameraRef} 
        />
      )}

      {/* Bounding boxes */}
      {boxes.map((box, index) => (
        <View
          key={`${box.trackId || 'box'}-${index}`}
          style={[
            styles.boundingBox, 
            { 
              left: box.x, 
              top: box.y, 
              width: box.width, 
              height: box.height,
              borderColor: box.color || '#00FF00' 
            }
          ]}
        >
          {box.trackId && (
            <Text style={styles.trackLabel}>ID: {box.trackId}</Text>
          )}
          <Text style={styles.boxLabel}>
            {box.score ? `${(box.score * 100).toFixed(0)}%` : ''}
          </Text>
        </View>
      ))}


      {/* Door bounding box */}
    {doorBoxes.map((box, idx) => (
      <View
        key={`door-${idx}`}
        style={[
        styles.boundingBox,
        {
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          borderColor: box.color,
          borderStyle: 'dashed',
        }
      ]}
      >
      <Text style={styles.trackLabel}>PUERTA</Text>
      </View>
    ))}

    {doorPreviewBox && (
      <View
      style={[
        styles.boundingBox,
        {
          left: doorPreviewBox.x,
          top: doorPreviewBox.y,
          width: doorPreviewBox.width,
          height: doorPreviewBox.height,
          borderColor: '#00BFFF',
          borderStyle: 'dotted',
        }
      ]}
      />
    )}


      {/* Botones de control */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('Tabs', { screen: 'Inicio' })}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {!isWeb && (
        <>
          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Ionicons 
              name={flash === 'off' ? 'flash-off' : 'flash'} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleCamera} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}

      {/* Botón de puertas */}

      <TouchableOpacity
      style={styles.doorButton}
        onPress={() => {
        setDoorBoxes([]);
        setDoorCoordsRaw(null);
        setIsDrawingDoor(true);
        }}
      disabled={isProcessing}
      >
  <MaterialCommunityIcons name="door" size={24} color="white" />
</TouchableOpacity>

      {/* Botones principales de acción */}
      <View style={styles.actionButtonsContainer}>
        {/* Botón de detección normal */}
        <TouchableOpacity
          style={[
            styles.captureButton, 
            styles.halfButton,
            (isProcessing || isModelLoading || isTracking) && { backgroundColor: '#777' },
            isDetecting && { backgroundColor: '#F44336' }
          ]}
          onPress={() => {
            if (isDetecting) {
              stopDetection();
            } else {
              startDetection();
            }
          }}
          disabled={isProcessing || isModelLoading || isTracking}
        >
          <Ionicons 
            name={isDetecting ? "stop-circle" : "camera"} 
            size={22} 
            color="white" 
          />
          <Text style={styles.buttonText}>
            {isDetecting ? 'Detener' : 'Detección'}
          </Text>
        </TouchableOpacity>

        {/* Botón de tracking */}
        <TouchableOpacity
          style={[
            styles.trackingButton, 
            styles.halfButton,
            (isProcessing || isModelLoading || isDetecting) && { backgroundColor: '#777' },
            isTracking && { backgroundColor: '#F44336' }
          ]}
          onPress={() => {
            if (isTracking) {
              stopTracking();
            } else {
              startTrackingSession();
            }
          }}
          disabled={isProcessing || isModelLoading || isDetecting}
        >
          <FontAwesome5 
            name={isTracking ? "stop-circle" : "walking"} 
            size={22} 
            color="white" 
          />
          <Text style={styles.buttonText}>
            {isTracking ? 'Detener' : 'Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contadores */}
      <View style={styles.countContainer}>
        {isTracking ? (
          <>
            <Text style={styles.countText}>
              Personas dentro: {trackingStats.personas_dentro}
            </Text>
            <Text style={styles.statsText}>
              Entradas: {trackingStats.entradas} | Salidas: {trackingStats.salidas}
            </Text>
            <Text style={styles.frameText}>
              Frame: {frameCounter}
            </Text>
          </>
        ) : isDetecting ? (
          <Text style={styles.countText}>
            Personas detectadas: {personCount}
          </Text>
        ) : null}
      </View>

      {/* Modal de tracking */}
      <Modal
        visible={showTrackingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTrackingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tracking Activo</Text>
            
            <View style={styles.modalStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{trackingStats.personas_dentro}</Text>
                <Text style={styles.statLabel}>Dentro</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{trackingStats.entradas}</Text>
                <Text style={styles.statLabel}>Entradas</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{trackingStats.salidas}</Text>
                <Text style={styles.statLabel}>Salidas</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{frameCounter}</Text>
                <Text style={styles.statLabel}>Frames</Text>
              </View>
            </View>
            
            <Text style={styles.modalInfo}>
              • VERDE: Persona dentro del área de la puerta
            </Text>
            <Text style={styles.modalInfo}>
              • ROJO: Persona fuera del área de la puerta
            </Text>
            <Text style={styles.modalInfo}>
              • ID: Número único para seguir a cada persona
            </Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowTrackingModal(false);
              }}
            >
              <Text style={styles.modalButtonText}>Minimizar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonStop]}
              onPress={() => {
                setShowTrackingModal(false);
                stopTracking();
              }}
            >
              <Text style={styles.modalButtonText}>Finalizar Tracking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Indicador de carga */}
      {(isProcessing || isModelLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {isModelLoading ? 'Cargando...' : 'Procesando...'}
          </Text>
        </View>
      )}
{isWeb && isDrawingDoor && (
  <View
    style={[
      StyleSheet.absoluteFill,
      {
        backgroundColor: 'rgba(0,0,0,0.01)',
        zIndex: 999,
        cursor: 'crosshair',
        pointerEvents: 'auto',
      },
    ]}
    {...doorPanResponder.panHandlers}
  />
)}
    </View>
  );
}

// =================== ESTILOS ===================
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  video: { 
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    objectFit: 'cover' 
  },
  
  // Botones de acción
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    backgroundColor: '#4CAF50',
  },
  trackingButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    marginLeft: 8,
    fontSize: 14 
  },
  
  // Botones flotantes
  backButton: { 
    position: 'absolute', 
    top: 40, 
    left: 20, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    padding: 10, 
    borderRadius: 20 
  },
  flashButton: { 
    position: 'absolute', 
    top: 100, 
    left: 20, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    padding: 10, 
    borderRadius: 20 
  },
  toggleCamera: { 
    position: 'absolute', 
    top: 160, 
    left: 20, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    padding: 10, 
    borderRadius: 20 
  },
  doorButton: { 
    position: 'absolute', 
    top: 220, 
    left: 20, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    padding: 10, 
    borderRadius: 20 
  },
  
  // Contadores
  countContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  countText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center'
  },
  statsText: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center'
  },
  frameText: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 2
  },
  
  // Bounding boxes
  boundingBox: { 
    position: 'absolute', 
    borderWidth: 2, 
    backgroundColor: 'rgba(0,0,0,0.1)', 
    zIndex: 10, 
    pointerEvents: 'none' 
  },
  trackLabel: { 
    color: 'white', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    fontSize: 10, 
    position: 'absolute', 
    top: -15, 
    left: 0, 
    paddingHorizontal: 4,
    borderRadius: 3
  },
  boxLabel: { 
    color: 'white', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    fontSize: 10, 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    paddingHorizontal: 3 
  },
  
  // Modal de tracking
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  modalInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    textAlign: 'left',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonStop: {
    backgroundColor: '#F44336',
    marginTop: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  
  // Estilos para permisos
  message: { 
    textAlign: 'center', 
    paddingBottom: 10,
    fontSize: 16,
    color: '#333'
  },
  permissionButton: { 
    backgroundColor: '#007AFF', 
    padding: 15, 
    borderRadius: 10, 
    alignSelf: 'center' 
  },
  permissionText: { 
    color: '#fff', 
    fontSize: 16,
    fontWeight: 'bold'
  },
});
