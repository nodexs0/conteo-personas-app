import React, { useRef, useState, useCallback } from "react";
import { View, PanResponder, Text, TouchableOpacity, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ResizableBox({ box, layoutScale, onChange, onDelete }) {
  const [position, setPosition] = useState({
    left: box.xmin * layoutScale.x,
    top: box.ymin * layoutScale.y,
    width: (box.xmax - box.xmin) * layoutScale.x,
    height: (box.ymax - box.ymin) * layoutScale.y,
  });

  // Usar una ref para el estado actual
  const positionRef = useRef(position);
  positionRef.current = position;

  const maxWidth = 2448 * layoutScale.x;
  const maxHeight = 3264 * layoutScale.y;
  const minSize = 40;
  
  // Factores de sensibilidad separados
  const moveSensitivity = 1.0; // Sensibilidad para mover (100%)
  const resizeSensitivity = 0.5; // Sensibilidad para redimensionar (30% - más lento)

  // Mover caja
  const movePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastMove.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (_, gesture) => {
        const dx = (gesture.dx - lastMove.current.x) * moveSensitivity;
        const dy = (gesture.dy - lastMove.current.y) * moveSensitivity;

        setPosition((prev) => ({
          ...prev,
          left: Math.max(0, Math.min(maxWidth - prev.width - 5, prev.left + dx)),
          top: Math.max(0, Math.min(maxHeight - prev.height - 5, prev.top + dy)),
        }));

        lastMove.current = { x: gesture.dx, y: gesture.dy };
      },
      onPanResponderRelease: () => {
        const current = positionRef.current;
        onChange({
          xmin: Math.max(0, current.left / layoutScale.x),
          ymin: Math.max(0, current.top / layoutScale.y),
          xmax: Math.min(2448, (current.left + current.width) / layoutScale.x),
          ymax: Math.min(3264, (current.top + current.height) / layoutScale.y),
        });
      },
    })
  ).current;

  const lastMove = useRef({ x: 0, y: 0 });

  // Redimensionar desde esquinas - versión simplificada y estable
  const createResizePan = useCallback((corner) => {
    let lastDx = 0;
    let lastDy = 0;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastDx = 0;
        lastDy = 0;
      },
      onPanResponderMove: (_, gesture) => {
        // Calcular el movimiento delta desde la última actualización
        const deltaX = (gesture.dx - lastDx) * resizeSensitivity;
        const deltaY = (gesture.dy - lastDy) * resizeSensitivity;
        
        lastDx = gesture.dx;
        lastDy = gesture.dy;

        // Solo procesar si hay movimiento significativo
        if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
          return;
        }

        setPosition((prev) => {
          let newLeft = prev.left;
          let newTop = prev.top;
          let newWidth = prev.width;
          let newHeight = prev.height;

          switch (corner) {
            case "topLeft":
              newWidth = Math.max(minSize, prev.width - deltaX);
              newHeight = Math.max(minSize, prev.height - deltaY);
              newLeft = Math.max(0, prev.left + deltaX);
              newTop = Math.max(0, prev.top + deltaY);
              
              if (newLeft < 0) {
                newWidth = prev.width + prev.left;
                newLeft = 0;
              }
              if (newTop < 0) {
                newHeight = prev.height + prev.top;
                newTop = 0;
              }
              break;
            
            case "topRight":
              newWidth = Math.max(minSize, Math.min(maxWidth - prev.left - 5, prev.width + deltaX));
              newHeight = Math.max(minSize, prev.height - deltaY);
              newTop = Math.max(0, prev.top + deltaY);
              
              if (prev.left + newWidth > maxWidth - 5) {
                newWidth = maxWidth - prev.left - 5;
              }
              if (newTop < 0) {
                newHeight = prev.height + prev.top;
                newTop = 0;
              }
              break;
            
            case "bottomLeft":
              newWidth = Math.max(minSize, prev.width - deltaX);
              newHeight = Math.max(minSize, Math.min(maxHeight - prev.top - 5, prev.height + deltaY));
              newLeft = Math.max(0, prev.left + deltaX);
              
              if (newLeft < 0) {
                newWidth = prev.width + prev.left;
                newLeft = 0;
              }
              if (prev.top + newHeight > maxHeight - 5) {
                newHeight = maxHeight - prev.top - 5;
              }
              break;
            
            case "bottomRight":
              newWidth = Math.max(minSize, Math.min(maxWidth - prev.left - 5, prev.width + deltaX));
              newHeight = Math.max(minSize, Math.min(maxHeight - prev.top - 5, prev.height + deltaY));
              
              if (prev.left + newWidth > maxWidth - 5) {
                newWidth = maxWidth - prev.left - 5;
              }
              if (prev.top + newHeight > maxHeight - 5) {
                newHeight = maxHeight - prev.top - 5;
              }
              break;
          }

          return {
            left: newLeft,
            top: newTop,
            width: newWidth,
            height: newHeight
          };
        });
      },
      onPanResponderRelease: () => {
        const current = positionRef.current;
        onChange({
          xmin: Math.max(0, current.left / layoutScale.x),
          ymin: Math.max(0, current.top / layoutScale.y),
          xmax: Math.min(2448, (current.left + current.width) / layoutScale.x),
          ymax: Math.min(3264, (current.top + current.height) / layoutScale.y),
        });
      },
    });
  }, [layoutScale, maxWidth, maxHeight, minSize, resizeSensitivity]);

  // Crear los pan responders para cada esquina
  const [panResponders] = useState(() => ({
    topLeft: createResizePan("topLeft"),
    topRight: createResizePan("topRight"),
    bottomLeft: createResizePan("bottomLeft"),
    bottomRight: createResizePan("bottomRight"),
  }));

  const cornerStyle = {
    width: 20,
    height: 20,
    backgroundColor: "white",
    position: "absolute",
    zIndex: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  };

  return (
    <View
      {...movePan.panHandlers}
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        width: position.width,
        height: position.height,
        borderWidth: 2,
        borderColor: "lime",
        backgroundColor: "rgba(0,255,0,0.15)",
      }}
    >
      <Text
        style={{
          position: "absolute",
          top: -18,
          left: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "white",
          fontSize: 11,
          paddingHorizontal: 5,
          borderRadius: 3,
        }}
      >
        c:{box.class} s:{(box.score * 100).toFixed(0)}%
      </Text>

      {/* Botón eliminar */}
      <TouchableOpacity
        onPress={onDelete}
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 24,
          height: 24,
          backgroundColor: "red",
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 200,
          borderWidth: 1,
          borderColor: "white",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>X</Text>
      </TouchableOpacity>

      {/* Esquinas */}
      <View {...panResponders.topLeft.panHandlers} style={{ ...cornerStyle, top: -10, left: -10 }} />
      <View {...panResponders.topRight.panHandlers} style={{ ...cornerStyle, top: -10, right: -10 }} />
      <View {...panResponders.bottomLeft.panHandlers} style={{ ...cornerStyle, bottom: -10, left: -10 }} />
      <View {...panResponders.bottomRight.panHandlers} style={{ ...cornerStyle, bottom: -10, right: -10 }} />
    </View>
  );
}