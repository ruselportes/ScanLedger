import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchStaffList } from '../../services/dataService';
import { supabase } from '../../services/supabase';
import { UserProfile } from '../../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

export default function StaffManagementScreen() {
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await fetchStaffList();
    setStaff(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleToggleActive = (member: UserProfile) => {
    const isActive = member.is_active !== false; // default true if undefined
    const action = isActive ? 'Disable' : 'Enable';
    const message = isActive
      ? `Disable ${member.full_name}'s account? They will no longer be able to access the app.`
      : `Re-enable ${member.full_name}'s account? They will regain access to the app.`;

    Alert.alert(`${action} Staff Account`, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        style: isActive ? 'destructive' : 'default',
        onPress: async () => {
          setToggling(member.id);
          try {
            const { error } = await supabase
              .from('profiles')
              .update({ is_active: !isActive })
              .eq('id', member.id);

            if (error) {
              Alert.alert('Error', `Failed to ${action.toLowerCase()} account: ${error.message}`);
            } else {
              // Update local state immediately for snappy UI
              setStaff((prev) =>
                prev.map((s) =>
                  s.id === member.id ? { ...s, is_active: !isActive } : s
                )
              );
            }
          } catch (err) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
          } finally {
            setToggling(null);
          }
        },
      },
    ]);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const renderItem = ({ item }: { item: UserProfile }) => {
    const isActive = item.is_active !== false;
    const isToggling = toggling === item.id;

    return (
      <View style={[styles.card, !isActive && styles.cardDisabled]}>
        <View style={[styles.avatar, !isActive && styles.avatarDisabled]}>
          <Text style={[styles.avatarText, !isActive && styles.avatarTextDisabled]}>
            {getInitials(item.full_name)}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, !isActive && styles.cardNameDisabled]}>
            {item.full_name}
          </Text>
          <Text style={styles.cardEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, !isActive && styles.roleBadgeDisabled]}>
            <Text style={[styles.roleBadgeText, !isActive && styles.roleBadgeTextDisabled]}>
              {isActive ? 'Staff · Active' : 'Staff · Disabled'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.actionBtn, isActive ? styles.disableBtn : styles.enableBtn]}
          onPress={() => handleToggleActive(item)}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={isActive ? Colors.danger : Colors.primary} />
          ) : (
            <Text style={[styles.actionBtnText, isActive ? styles.disableBtnText : styles.enableBtnText]}>
              {isActive ? '⊘' : '✓'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <Text style={styles.headerSub}>Manage authorized staff accounts</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
      ) : (
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListHeaderComponent={
            staff.length > 0 ? (
              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Text style={styles.statChipNum}>{staff.filter(s => s.is_active !== false).length}</Text>
                  <Text style={styles.statChipLabel}>Active</Text>
                </View>
                <View style={[styles.statChip, styles.statChipDanger]}>
                  <Text style={[styles.statChipNum, { color: Colors.danger }]}>{staff.filter(s => s.is_active === false).length}</Text>
                  <Text style={styles.statChipLabel}>Disabled</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statChipNum}>{staff.length}</Text>
                  <Text style={styles.statChipLabel}>Total</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyTitle}>No staff registered</Text>
              <Text style={styles.emptyText}>Contact your administrator to add staff accounts</Text>
            </View>
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statChip: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statChipDanger: { borderColor: 'rgba(248,113,113,0.2)' },
  statChipNum: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  statChipLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  cardDisabled: {
    opacity: 0.55,
    borderColor: 'rgba(248,113,113,0.15)',
    backgroundColor: 'rgba(248,113,113,0.03)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,229,160,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  avatarDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: Colors.textMuted,
  },
  avatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  avatarTextDisabled: { color: Colors.textMuted },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardNameDisabled: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  cardEmail: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  roleBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  roleBadgeDisabled: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderColor: 'rgba(248,113,113,0.25)',
  },
  roleBadgeText: { fontSize: FontSize.xs, color: '#A78BFA', fontWeight: '600' },
  roleBadgeTextDisabled: { color: Colors.danger },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disableBtn: { backgroundColor: 'rgba(248,113,113,0.1)' },
  enableBtn: { backgroundColor: 'rgba(0,229,160,0.12)' },
  actionBtnText: { fontSize: FontSize.lg },
  disableBtnText: { color: Colors.danger },
  enableBtnText: { color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl * 2, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
});
