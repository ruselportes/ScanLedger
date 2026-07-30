import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

export default function OwnerSettingsScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const MenuItem = ({
    icon, label, sub, onPress, danger,
  }: { icon: string; label: string; sub?: string; onPress?: () => void; danger?: boolean }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>Account & App Configuration</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'OW'}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{profile?.full_name || 'Owner'}</Text>
            <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Owner</Text>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            <MenuItem icon="👤" label="Profile" sub="View and edit your profile" />
            <MenuItem icon="🔒" label="Change Password" sub="Update your account password" />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.sectionCard}>
            <MenuItem icon="📱" label="Device Management" sub="Manage registered devices" />
            <MenuItem icon="☁️" label="Sync Status" sub="View offline queue and sync status" />
            <MenuItem icon="📊" label="Export Reports" sub="Download revenue reports as PDF/CSV" />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <View style={styles.sectionCard}>
            <MenuItem icon="🚪" label="Sign Out" danger onPress={handleSignOut} />
          </View>
        </View>

        <Text style={styles.versionText}>ScanLedger v1.0.0 · Built with ❤️ for your gym</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  header: {
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderActive,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,229,160,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  profileName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  roleBadge: {
    marginTop: 6,
    backgroundColor: 'rgba(0,229,160,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.3)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  roleBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  sectionCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: 'rgba(248,113,113,0.1)' },
  menuIconText: { fontSize: 16 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: FontSize.md, fontWeight: '500', color: Colors.textPrimary },
  menuSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  menuChevron: { fontSize: FontSize.xl, color: Colors.textMuted },
  versionText: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.lg },
});
