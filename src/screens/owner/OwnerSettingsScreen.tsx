import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { fetchUploadHistory } from '../../services/dataService';
import { getQueue } from '../../services/offlineQueue';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

type ActiveModal = 'profile' | 'password' | 'sync' | 'export' | null;

export default function OwnerSettingsScreen() {
  const { profile, signOut, switchRole, refreshProfile } = useAuth();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Profile edit
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Sync status
  const [queueCount, setQueueCount] = useState(0);
  const [syncLoading, setSyncLoading] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  const openModal = useCallback(async (type: ActiveModal) => {
    setActiveModal(type);
    if (type === 'profile') setEditName(profile?.full_name || '');
    if (type === 'password') { setNewPassword(''); setConfirmPassword(''); }
    if (type === 'sync') {
      setSyncLoading(true);
      const q = await getQueue();
      setQueueCount(q.length);
      setSyncLoading(false);
    }
  }, [profile]);

  const closeModal = () => setActiveModal(null);

  // --- Profile Save ---
  const handleSaveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return; }
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName.trim() })
      .eq('id', profile?.id);
    setSavingProfile(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      await refreshProfile();
      closeModal();
    }
  };

  // --- Password Change ---
  const handleChangePassword = async () => {
    if (newPassword.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match.'); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Your password has been updated.');
      closeModal();
    }
  };

  // --- Export CSV ---
  const handleExport = async () => {
    setExporting(true);
    try {
      const uploads = await fetchUploadHistory(100);
      if (uploads.length === 0) {
        Alert.alert('No Data', 'No upload records available to export.');
        setExporting(false);
        return;
      }
      // Build CSV
      const header = 'Date,Staff,Entries,Total Amount,Synced,Created At';
      const rows = uploads.map((u) =>
        [
          u.date,
          `"${u.staff_name || 'Staff'}"`,
          u.total_entries,
          u.total_amount,
          u.is_synced ? 'Yes' : 'No',
          u.created_at,
        ].join(',')
      );
      const csv = [header, ...rows].join('\n');
      await Share.share({
        title: 'ScanLedger Revenue Report',
        message: csv,
      });
    } catch (err) {
      Alert.alert('Export Failed', 'Could not generate report. Please try again.');
    } finally {
      setExporting(false);
      closeModal();
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
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
            <MenuItem icon="👤" label="Edit Profile" sub="Update your display name" onPress={() => openModal('profile')} />
            <MenuItem icon="🔒" label="Change Password" sub="Update your account password" onPress={() => openModal('password')} />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.sectionCard}>
            <MenuItem icon="☁️" label="Sync Status" sub="View offline queue and sync status" onPress={() => openModal('sync')} />
            <MenuItem icon="📊" label="Export Reports" sub="Download revenue records as CSV" onPress={() => openModal('export')} />
          </View>
        </View>

        {/* Session & Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session & Mode</Text>
          <View style={styles.sectionCard}>
            <MenuItem icon="📸" label="Switch to Staff Mode" sub="Return to camera scanner view" onPress={() => switchRole('staff')} />
            <MenuItem icon="🚪" label="Sign Out" danger onPress={handleSignOut} />
          </View>
        </View>

        <Text style={styles.versionText}>ScanLedger v1.0.0 · Built with ❤️ for your gym</Text>
      </ScrollView>

      {/* ──────────────── MODALS ──────────────── */}

      {/* Profile Edit Modal */}
      <Modal visible={activeModal === 'profile'} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={savingProfile}>
                <LinearGradient colors={['#00E5A0', '#00B87A']} style={styles.saveBtnGrad}>
                  {savingProfile ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Save</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={activeModal === 'password'} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              autoFocus
            />
            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={savingPassword}>
                <LinearGradient colors={['#00E5A0', '#00B87A']} style={styles.saveBtnGrad}>
                  {savingPassword ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Update</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sync Status Modal */}
      <Modal visible={activeModal === 'sync'} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Sync Status</Text>
            {syncLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.xl }} />
            ) : (
              <>
                <View style={styles.syncRow}>
                  <Text style={styles.syncLabel}>📤 Pending in Queue</Text>
                  <Text style={[styles.syncValue, { color: queueCount > 0 ? Colors.warning : Colors.primary }]}>
                    {queueCount} {queueCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>
                <View style={styles.syncRow}>
                  <Text style={styles.syncLabel}>🌐 Sync Status</Text>
                  <Text style={[styles.syncValue, { color: queueCount > 0 ? Colors.warning : Colors.primary }]}>
                    {queueCount > 0 ? 'Pending' : 'All synced ✓'}
                  </Text>
                </View>
                {queueCount > 0 && (
                  <Text style={styles.syncHint}>
                    Pull to refresh on the History tab to sync pending items.
                  </Text>
                )}
              </>
            )}
            <TouchableOpacity style={[styles.cancelBtn, { marginTop: Spacing.lg }]} onPress={closeModal}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal visible={activeModal === 'export'} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Export Revenue Report</Text>
            <Text style={styles.exportDesc}>
              Exports the last 100 logbook uploads as a CSV file you can share via email, messaging, or save to your device.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleExport} disabled={exporting}>
                <LinearGradient colors={['#00E5A0', '#00B87A']} style={styles.saveBtnGrad}>
                  {exporting ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>📤 Export CSV</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,229,160,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  profileName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  roleBadge: {
    marginTop: 6, backgroundColor: 'rgba(0,229,160,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.3)',
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  roleBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700', textTransform: 'uppercase' },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  sectionCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md,
  },
  menuIcon: { width: 36, height: 36, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: 'rgba(248,113,113,0.1)' },
  menuIconText: { fontSize: 16 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: FontSize.md, fontWeight: '500', color: Colors.textPrimary },
  menuSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  menuChevron: { fontSize: FontSize.xl, color: Colors.textMuted },
  versionText: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.lg },
  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, paddingBottom: 40,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
  inputLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '600' },
  input: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 14, color: Colors.textPrimary, fontSize: FontSize.md,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: BorderRadius.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bgElevated,
  },
  cancelBtnText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  saveBtnGrad: { padding: 14, alignItems: 'center' },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textOnPrimary },
  // Sync
  syncRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderColor: Colors.border },
  syncLabel: { fontSize: FontSize.md, color: Colors.textPrimary },
  syncValue: { fontSize: FontSize.md, fontWeight: '700' },
  syncHint: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.md, textAlign: 'center', fontStyle: 'italic' },
  // Export
  exportDesc: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
});
