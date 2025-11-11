import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Image, Text, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import ResizableBox from "../components/ResizableBox";

export default function DoorDetectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { photoUri } = route.params || {};

  const [doorBoxes, setDoorBoxes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLayout, setImageLayout] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [noDoorsDetected, setNoDoorsDetected] = useState(false);

  useEffect(() => {
    if (photoUri) {
      Image.getSize(photoUri, (width, height) => setImageSize({ width, height }));
      detectDoors(photoUri);
    }
  }, [photoUri]);

  useEffect(() => {
    // Crear caja manual si no se detectaron puertas y ya tenemos layout
    if (noDoorsDetected && imageLayout) {
      Alert.alert(
        "No se detectaron puertas",
        "Se agregará una caja para que puedas ajustar la puerta manualmente."
      );
      const w = 200;
      const h = 300;
      const cx = (2448 / 2) - (w / 2);
      const cy = (3264 / 2) - (h / 2);
      setDoorBoxes([{ xmin: cx, ymin: cy, xmax: cx + w, ymax: cy + h, score: 1, class: 0 }]);
      setNoDoorsDetected(false); // evitar repetir alert
    }
  }, [noDoorsDetected, imageLayout]);

  const detectDoors = async (uri) => {
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append("file", { uri, type: "image/jpeg", name: "photo.jpg" });

      const response = await axios.post("http://192.168.1.68:8000/predict/doors", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (response.data?.doors) {
        const doors = Array.isArray(response.data?.doors) ? response.data.doors : [];
        const boxes = doors
          .map((d) => {
            let bbox = d.bbox;
            if (Array.isArray(bbox[0])) bbox = bbox[0];
            if (!Array.isArray(bbox) || bbox.length < 4) return null;
            const [xmin, ymin, xmax, ymax] = bbox.map(Number);
            return { xmin, ymin, xmax, ymax, score: Number(d.score ?? 0), class: Number(d.class ?? -1) };
          })
          .filter(Boolean);

        if (boxes.length === 0) {
          setNoDoorsDetected(true); // marcar que no se detectaron puertas
        } else {
          setDoorBoxes(boxes);
        }
      } else {
        console.log("No se recibieron puertas en la respuesta");
        setNoDoorsDetected(true); // marcar que no se detectaron puertas
      }
    } catch (err) {
      console.log("Error detectando puertas:", err);
      if (err.message.includes('Network Error') || err.message.includes('AxiosError')) {
        console.log('Error de red: Verifica que el servidor esté corriendo y accesible.');
      } else {
        Alert.alert('Error', 'No se pudo detectar personas: ' + err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.imageContainer}
        onLayout={(e) => setImageLayout(e.nativeEvent.layout)}
      >
        <Image source={{ uri: photoUri }} style={styles.imagePreview} resizeMode="contain" />

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Procesando imagen...</Text>
          </View>
        )}

        {imageLayout &&
          doorBoxes.map((box, idx) => (
            <ResizableBox
              key={idx}
              box={box}
              layoutScale={{ x: imageLayout.width / 2448, y: imageLayout.height / 3264 }}
              onChange={(newBox) => {
                setDoorBoxes((prev) => {
                  const copy = [...prev];
                  copy[idx] = { ...copy[idx], ...newBox };
                  return copy;
                });
              }}
              onDelete={() => {
                setDoorBoxes((prev) => prev.filter((_, i) => i !== idx));
              }}
            />
          ))}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => {
          Alert.alert("Puerta ajustada", "Los valores han sido guardados.");
          navigation.goBack();
        }}
      >
        <Ionicons name="checkmark" size={24} color="white" />
        <Text style={styles.buttonText}>Confirmar Ajuste</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  imageContainer: { flex: 1, position: "relative", backgroundColor: "#000" },
  imagePreview: { width: "100%", height: "100%" },
  backButton: { position: "absolute", top: 50, left: 20, zIndex: 80, backgroundColor: "rgba(0,0,0,0.7)", padding: 12, borderRadius: 25 },
  saveButton: { position: "absolute", bottom: 30, left: 20, right: 20, zIndex: 80, backgroundColor: "#4CAF50", padding: 16, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  buttonText: { color: "white", marginLeft: 10, fontWeight: "bold", fontSize: 16 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
});
