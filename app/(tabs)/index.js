import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [items, setItems] = useState([]);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  // 1. Handle Permissions
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Add Item Helper
  const addItem = (uri, name) => {
    const newItem = {
      id: Date.now().toString(),
      uri: uri,
      name: name,
      timestamp: new Date().toLocaleTimeString(),
    };
    setItems((prev) => [newItem, ...prev]);
  };

  // 3. Logic: QR Detected
  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    if (cameraRef.current) {
      try {
        // Snap a photo of the item
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        addItem(photo.uri, data); // Use QR data as the name
        Alert.alert("QR Scanned!", `Added: ${data}`);
      } catch (error) {
        console.log("Error:", error);
      }
    }

    // Cooldown to prevent double-scanning
    setTimeout(() => setScanned(false), 1500);
  };

  // 4. Logic: Manual Photo (No QR)
  const takeManualPhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        addItem(photo.uri, "Manual Item");
      } catch (error) {
        console.log("Error:", error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Camera Section */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          ref={cameraRef}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"], // <--- RESTRICTED TO QR ONLY
          }}
        >
          <View style={styles.cameraOverlay}>
            <Text style={styles.overlayText}>
              {scanned ? "Processing..." : "Scan QR Code"}
            </Text>
            
            {/* Manual Shutter Button */}
            <TouchableOpacity style={styles.captureBtn} onPress={takeManualPhoto}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>

      {/* Table Section */}
      <View style={styles.listContainer}>
        <Text style={styles.headerTitle}>Inventory List</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              <View style={styles.textContainer}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSub}>Scanned at {item.timestamp}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No items scanned yet.</Text>
          }
        />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 30 },
  cameraContainer: { height: '40%', margin: 10, borderRadius: 15, overflow: 'hidden' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 },
  overlayText: { color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, marginBottom: 10, borderRadius: 5 },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  listContainer: { flex: 1, paddingHorizontal: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  tableRow: { flexDirection: 'row', backgroundColor: 'white', padding: 10, marginBottom: 10, borderRadius: 10, alignItems: 'center', elevation: 2 },
  thumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  textContainer: { marginLeft: 15, justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemSub: { fontSize: 12, color: '#888', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 },
  button: { backgroundColor: 'blue', padding: 15, borderRadius: 8, marginTop: 10, alignSelf: 'center' },
  text: { color: 'white', fontWeight: 'bold' }
});