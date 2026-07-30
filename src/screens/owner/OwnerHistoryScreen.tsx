import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchUploadHistory } from '../../services/dataService';
import { LogbookUpload } from '../../types';
import { formatCurrency, formatDate } from '../../utils/parser';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

export default function OwnerHistoryScreen() {
  const [uploads, setUploads] = useState<LogbookUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchUploadHistory(50);
    setUploads(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: LogbookUpload }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
        <Text style={styles.cardStaff}>By: {item.staff_name || 'Staff'}</Text>
        <Text style={styles.cardEntries}>{item.total_entries} entries</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardRevenue}>{formatCurrency(item.total_amount)}</Text>
        <View style={[styles.syncDot, item.is_synced ? styles.syncedDot : styles.pendingDot]} />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Revenue History</Text>
        <Text style={styles.headerSub}>All processed logbook uploads</Text>
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
              <Text style={styles.emptyIcon}>📚</Text>
              <Text style={styles.emptyTitle}>No history yet</Text>
              <Text style={styles.emptyText}>Revenue records will appear here once staff begin uploading</Text>
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
  list: { padding: Spacing.lg, gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLeft: { flex: 1 },
  cardDate: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardStaff: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3 },
  cardEntries: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: Spacing.xs },
  cardRevenue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.revenue },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  syncedDot: { backgroundColor: Colors.primary },
  pendingDot: { backgroundColor: Colors.warning },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl * 2, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
});
