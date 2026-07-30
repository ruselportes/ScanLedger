import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { fetchTodayUploads } from '../../services/dataService';
import { getQueue, syncQueue } from '../../services/offlineQueue';
import { LogbookUpload } from '../../types';
import { formatCurrency, formatDate } from '../../utils/parser';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

export default function StaffHistoryScreen() {
  const { profile, signOut, switchRole } = useAuth();
  const [uploads, setUploads] = useState<LogbookUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    let staffId = profile?.id;
    if (!staffId) {
      const { data } = await supabase.auth.getUser();
      staffId = data.user?.id;
    }

    // 1. Try syncing any offline queued items
    await syncQueue().catch((err) => console.warn('syncQueue error:', err));

    // 2. Fetch today's remote uploads
    const remoteData = staffId ? await fetchTodayUploads(staffId) : [];

    // 3. Get local pending queue
    const queue = await getQueue();
    const pendingUploads: LogbookUpload[] = queue.map((q) => q.upload);

    // 4. Combine pending + remote (deduplicated)
    const combined = [
      ...pendingUploads,
      ...remoteData.filter((r) => !pendingUploads.some((p) => p.id === r.id)),
    ];

    setUploads(combined);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    const res = await syncQueue().catch(() => ({ synced: 0, failed: 0 }));
    await load();
    setRefreshing(false);

    if (res.synced > 0) {
      Alert.alert('Sync Successful', `Successfully synced ${res.synced} pending logbook upload(s) to the cloud!`);
    } else if (res.failed > 0) {
      Alert.alert('Sync Warning', `Failed to sync ${res.failed} item(s). Please check your internet connection.`);
    }
  };

  const renderItem = ({ item }: { item: LogbookUpload }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
          <Text style={styles.cardMeta}>{item.total_entries} entries</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={styles.amountBadgeText}>{formatCurrency(item.total_amount)}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.syncBadge, item.is_synced ? styles.syncedBadge : styles.pendingBadge]}>
          <Text style={styles.syncBadgeText}>{item.is_synced ? '✓ Synced' : '⏳ Pending Sync'}</Text>
        </View>
        <Text style={styles.cardTime}>
          {new Date(item.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Today's Uploads</Text>
            <Text style={styles.headerSub}>Your processed logbooks</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.roleSwitchBtn}
              onPress={() => switchRole('owner')}
            >
              <Text style={styles.roleSwitchText}>👑 Admin View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
      ) : (
        <FlatList
          data={uploads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No uploads today</Text>
              <Text style={styles.emptyText}>Capture a logbook page to get started</Text>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  roleSwitchBtn: {
    backgroundColor: 'rgba(0,229,160,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.4)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  roleSwitchText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },
  signOutBtn: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  signOutText: { fontSize: FontSize.xs, color: Colors.danger, fontWeight: '600' },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  cardDate: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  amountBadge: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  amountBadgeText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.revenue },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  syncBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  syncedBadge: { backgroundColor: 'rgba(0,229,160,0.12)' },
  pendingBadge: { backgroundColor: 'rgba(251,191,36,0.12)' },
  syncBadgeText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  cardTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl * 2 },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
});
