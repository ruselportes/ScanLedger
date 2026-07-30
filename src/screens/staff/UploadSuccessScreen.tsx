import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { formatCurrency } from '../../utils/parser';
import { StaffStackParamList } from '../../navigation/StaffStack';

type RoutePropType = RouteProp<StaffStackParamList, 'UploadSuccess'>;
type NavProp = NativeStackNavigationProp<StaffStackParamList, 'UploadSuccess'>;

export default function UploadSuccessScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { total, entryCount } = route.params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={['#00E5A0', '#00B87A']} style={styles.iconCircle}>
          <Text style={styles.icon}>✓</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Upload Successful!</Text>
        <Text style={styles.subtitle}>Revenue data has been saved</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Date</Text>
          <Text style={styles.cardValue}>{dateStr}</Text>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>Payment Entries</Text>
          <Text style={styles.cardValue}>{entryCount}</Text>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>Total Revenue</Text>
          <Text style={styles.revenueValue}>{formatCurrency(total)}</Text>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>Processed Time</Text>
          <Text style={styles.cardValue}>{timeStr}</Text>
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate('Camera')}
        >
          <LinearGradient colors={['#00E5A0', '#00B87A']} style={styles.doneBtnGrad}>
            <Text style={styles.doneBtnText}>Scan Another Page</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('History')}>
          <Text style={styles.historyBtnText}>View History</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  iconContainer: { marginBottom: Spacing.xl },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 16,
  },
  icon: { fontSize: 52, color: Colors.textOnPrimary, fontWeight: '800' },
  content: { width: '100%', alignItems: 'center' },
  title: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  card: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  cardLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardValue: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary, marginTop: 4 },
  revenueValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.revenue, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  doneBtn: { width: '100%', borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.md },
  doneBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textOnPrimary },
  historyBtn: { paddingVertical: Spacing.sm },
  historyBtnText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
});
