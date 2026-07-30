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
import { UserProfile } from '../../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

export default function StaffManagementScreen() {
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleDisable = (member: UserProfile) => {
    Alert.alert(
      'Disable Staff Account',
      `Are you sure you want to disable ${member.full_name}'s account? They will no longer be able to access the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => Alert.alert('Feature Coming Soon', 'Staff account management will be available in the next update.'),
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.full_name}</Text>
        <Text style={styles.cardEmail}>{item.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Staff</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.disableBtn}
        onPress={() => handleDisable(item)}
      >
        <Text style={styles.disableBtnText}>⊘</Text>
      </TouchableOpacity>
    </View>
  );

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
  avatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
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
  roleBadgeText: { fontSize: FontSize.xs, color: '#A78BFA', fontWeight: '600' },
  disableBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(248,113,113,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disableBtnText: { fontSize: FontSize.lg, color: Colors.danger },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl * 2, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
});
