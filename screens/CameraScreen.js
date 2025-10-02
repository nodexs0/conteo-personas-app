import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off'); 
  const [menuVisible, setMenuVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [personCount, setPersonCount] = useState(4); 
  const navigation = useNavigation();

  if (!permission) {
    return <View><Text>Cargando...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos tu permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  function toggleFlash() {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  }

  return (
    <View style={styles.container}>
      {/* Cámara */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} flash={flash} />

      {/* Botón Volver */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Inicio')}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Botón Menú */}
      <TouchableOpacity
        style={styles.menuToggle}
        onPress={() => setMenuVisible(!menuVisible)}
      >
        <Text style={styles.menuToggleText}>☰</Text>
      </TouchableOpacity>

      {/* Menú desplegable */}
      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Inicio');
            }}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemText}>Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleCameraFacing} style={styles.menuItem}>
            <Text style={styles.menuItemText}>Cambiar Cámara</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón Flash */}
      <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
        <Ionicons
          name={flash === 'off' ? 'flash-off' : 'flash'}
          size={24}
          color="white"
        />
      </TouchableOpacity>

      {/* Conteo lateral */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>Hay {personCount} personas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  message: { textAlign: 'center', paddingBottom: 10 },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionText: { color: '#fff', fontSize: 16 },

  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },

  menuToggle: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
  },
  menuToggleText: { color: '#fff', fontSize: 24 },

  dropdownMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    paddingVertical: 10,
    width: 150,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
  },

  flashButton: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },

  countContainer: {
    position: 'absolute',
    left: -50,
    top: '40%',
    transform: [{ rotate: '-90deg' }],
  },
  countText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
