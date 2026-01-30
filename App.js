import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
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
  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Function to add item to the "Table" (List)
  const addItem = (uri, name) => {
    const newItem = {
      id: Date.now().toString(),
      uri: uri,
      name: name,
      timestamp: new Date().toLocaleTimeString(),
    };
    // Add to the beginning of the list
    setItems((prevItems) => [newItem, ...prevItems]);
  };

  // 3. Logic: QR Code Detected
  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned) return; // Prevent multiple rapid scans
    setScanned(true);
    
    // Automatically take a snapshot of the item when QR is found
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        addItem(photo.uri, `QR Item: ${data}`);
        Alert.alert("Success", `Added item: ${data}`);
      } catch (error) {
        console.log("Error taking scan photo:", error);
      }
    }

    // Reset scan capability after 2 seconds
    setTimeout(() => setScanned(false), 2000);
  };

  // 4. Logic: Manual Photo (No QR)
  const takeManualPhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        // In a real app, you might pop up a Modal here to ask for the name
        addItem(photo.uri, "Manual Item"); 
      } catch (error) {
        console.log("Error taking photo:", error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* SECTION: Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          ref={cameraRef}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <View style={styles.cameraOverlay}>
            <Text style={styles.overlayText}>
              {scanned ? "Processing..." : "Point at QR Code or Snap Photo"}
            </Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takeManualPhoto}>
              <View style={styles.captureBtnInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>

      {/* SECTION: The Table (List of Items) */}
      <View style={styles.listContainer}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              {/* Photo Column */}
              <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              
              {/* Data Column */}
              <View style={styles.textContainer}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSub}>{item.timestamp}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 30, // For Android status bar
  },
  cameraContainer: {
    height: '40%', // Camera takes top 40% of screen
    margin: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  overlayText: {
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    marginBottom: 10,
    borderRadius: 5,
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2, // Shadow for Android
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  textContainer: {
    marginLeft: 15,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  }
});