import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { StaffStackParamList } from '../../navigation/StaffStack';

type NavProp = NativeStackNavigationProp<StaffStackParamList, 'Camera'>;

export default function CameraScreen() {
  const navigation = useNavigation<NavProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>('back');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    startPulse();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: false,
      });
      if (photo?.uri) {
        navigation.navigate('Review', { imageUri: photo.uri, parsedEntries: [] });
      }
    } catch (e) {
      Alert.alert('Capture Failed', 'Could not take photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#0A0E1A', '#111827']} style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          ScanLedger needs camera access to capture logbook pages.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <LinearGradient colors={['#00E5A0', '#00B87A']} style={styles.permissionBtnGrad}>
            <Text style={styles.permissionBtnText}>Grant Access</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      
      <View style={styles.overlayWrapper} pointerEvents="box-none">
        {/* Header */}
        <LinearGradient
          colors={['rgba(10,14,26,0.9)', 'transparent']}
          style={styles.topOverlay}
        >
          <Text style={styles.headerTitle}>📖 Capture Logbook</Text>
          <Text style={styles.headerSub}>Align the page within the frame</Text>
        </LinearGradient>

        {/* Viewfinder Guide */}
        <View style={styles.frameGuide}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* Bottom Controls */}
        <LinearGradient
          colors={['transparent', 'rgba(10,14,26,0.95)']}
          style={styles.bottomOverlay}
        >
          <Text style={styles.tipText}>
            💡 Tip: Ensure good lighting and hold the camera steady
          </Text>
          <View style={styles.controls}>
            {/* Placeholder left */}
            <View style={{ width: 56 }} />

            {/* Shutter */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.shutter, capturing && styles.shutterCapturing]}
                onPress={handleCapture}
                disabled={capturing}
                activeOpacity={0.85}
              >
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            </Animated.View>

            {/* Gallery / import placeholder */}
            <View style={{ width: 56 }} />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', position: 'relative' },
  camera: { flex: 1 },
  overlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    flexDirection: 'column',
  },
  topOverlay: {
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  frameGuide: {
    flex: 1,
    margin: 40,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  bottomOverlay: {
    paddingTop: Spacing.xl,
    paddingBottom: 48,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  tipText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.lg, textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 3,
    borderColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCapturing: { borderColor: Colors.primary, backgroundColor: 'rgba(0,229,160,0.15)' },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.textPrimary,
  },
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  permissionIcon: { fontSize: 64, marginBottom: Spacing.lg },
  permissionTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  permissionText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  permissionBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', width: '100%' },
  permissionBtnGrad: { padding: 16, alignItems: 'center' },
  permissionBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textOnPrimary },
});
