import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [items, setItems] = useState([]);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  // 1. Permissions Check
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need camera access</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Add Item Logic
  const addItem = (uri, name) => {
    const newItem = {
      id: Date.now().toString(),
      uri: uri,
      name: name,
      timestamp: new Date().toLocaleTimeString(),
    };
    setItems((prev) => [newItem, ...prev]);
  };

  // 3. Delete Item Logic
  const deleteItem = (id) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // 4. Barcode Logic (With Delay Fix)
  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    // Delay to let camera focus
    await new Promise(resolve => setTimeout(resolve, 500));

    let imageUri = null;
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.5,
          shutterSound: false 
        });
        imageUri = photo.uri;
      } catch (error) {
        console.log("Photo failed, adding text only");
      }
    }

    const finalImage = imageUri || "https://via.placeholder.com/150?text=No+Image";
    addItem(finalImage, data);
    Alert.alert("Scanned!", `Added: ${data}`);

    setTimeout(() => setScanned(false), 2000);
  };

  // 5. Manual Photo Logic
  const takeManualPhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.5,
          shutterSound: false 
        });
        addItem(photo.uri, "Manual Item");
      } catch (error) {
        Alert.alert("Error", "Could not take photo");
      }
    }
  };

  // 6. The "Hidden" Red Delete Button
  const renderRightActions = (progress, dragX, itemId) => {
    return (
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => deleteItem(itemId)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  return (
    // IMPORTANT: Android needs this wrapper for swipes to work
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        
        {/* Camera Section */}
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            ref={cameraRef}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "upc_e", "upc_a", "code128"],
            }}
          />
          <View style={styles.cameraOverlay}>
            <Text style={styles.overlayText}>
              {scanned ? "Processing..." : "Scan Code or Snap Photo"}
            </Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takeManualPhoto}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listContainer}>
          <Text style={styles.headerTitle}>Inventory List</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              // Wrap each item in Swipeable
              <Swipeable
                renderRightActions={(progress, dragX) => 
                  renderRightActions(progress, dragX, item.id)
                }
              >
                <View style={styles.tableRow}>
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                  <View style={styles.textContainer}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>{item.timestamp}</Text>
                  </View>
                </View>
              </Swipeable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No items scanned yet.</Text>
            }
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
  },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraContainer: {
    height: '45%',
    margin: 10,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  overlayText: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    marginBottom: 20,
    borderRadius: 8,
    fontWeight: '600',
  },
  captureBtn: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
  listContainer: { flex: 1, paddingHorizontal: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    // Note: We moved marginBottom to the Swipeable container effectively by keeping it here
    // but Swipeable handles layout. 
    // To keep spacing nice, we might want a separator, but this works fine.
    marginBottom: 10, 
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  thumbnail: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  textContainer: { marginLeft: 15, justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#333' },
  itemSub: { fontSize: 12, color: '#888', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 16 },
  permissionBtn: { backgroundColor: 'blue', padding: 15, borderRadius: 8, marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },
  permissionText: { fontSize: 18, marginBottom: 10 },
  
  // NEW STYLES FOR SWIPE DELETE
  deleteButton: {
    backgroundColor: '#dd2c00',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%', // Match height of the row
    marginBottom: 10, // Match the row margin
    borderRadius: 10,
    marginLeft: 10,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  }
});