import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      shake();
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError);
      shake();
    }
  };

  return (
    <LinearGradient colors={['#0A0E1A', '#111827', '#0A0E1A']} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo / Brand */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#00E5A0', '#00B87A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoIcon}
            >
              <Text style={styles.logoIconText}>SL</Text>
            </LinearGradient>
            <Text style={styles.appName}>ScanLedger</Text>
            <Text style={styles.tagline}>Gym Revenue Digitizer</Text>
          </View>

          {/* Card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                onSubmitEditing={handleLogin}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#00E5A0', '#00B87A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textOnPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Your session will be saved automatically.{'\n'}You won't need to sign in again.
            </Text>
          </Animated.View>

          <Text style={styles.footer}>ScanLedger v1.0 · For authorized devices only</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  logoIconText: { fontSize: 28, fontWeight: '800', color: Colors.textOnPrimary },
  appName: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.lg },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500' },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  button: { marginTop: Spacing.sm, borderRadius: BorderRadius.md, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textOnPrimary },
  hint: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.md, lineHeight: 18 },
  footer: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xl },
});
