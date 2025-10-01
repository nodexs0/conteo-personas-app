import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';

export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [menuVisible, setMenuVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
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

  return (
    <View style={styles.container}>
      {/* Cámara */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} />

      {/* Botón del menú */}
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
              setMenuVisible(false); // Cierra el menú
              navigation.navigate('Inicio'); // Navega al inicio
            }}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemText}>Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleCameraFacing}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemText}>Cambiar Cámara</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  message: { textAlign: 'center', paddingBottom: 10 },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionText: { color: '#fff', fontSize: 16 },

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
});
