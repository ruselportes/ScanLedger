import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchUploadHistory, fetchUploadEntries } from '../../services/dataService';
import { LogbookUpload, LogbookEntry } from '../../types';
import { formatCurrency, formatDate } from '../../utils/parser';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

export default function OwnerHistoryScreen() {
  const [uploads, setUploads] = useState<LogbookUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Detail modal state
  const [selectedUpload, setSelectedUpload] = useState<LogbookUpload | null>(null);
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

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

  const openDetail = async (upload: LogbookUpload) => {
    setSelectedUpload(upload);
    setEntriesLoading(true);
    setEntries([]);
    slideAnim.setValue(300);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    const data = await fetchUploadEntries(upload.id);
    setEntries(data);
    setEntriesLoading(false);
  };

  const closeDetail = () => {
    Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => {
      setSelectedUpload(null);
      setEntries([]);
    });
  };

  const renderItem = ({ item }: { item: LogbookUpload }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetail(item)} activeOpacity={0.75}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
        <Text style={styles.cardStaff}>By: {item.staff_name || 'Staff'}</Text>
        <Text style={styles.cardEntries}>{item.total_entries} entries · tap to view</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardRevenue}>{formatCurrency(item.total_amount)}</Text>
        <View style={[styles.syncDot, item.is_synced ? styles.syncedDot : styles.pendingDot]} />
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Revenue History</Text>
        <Text style={styles.headerSub}>All processed logbook uploads · tap any card to view entries</Text>
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

      {/* Entry Detail Modal */}
      <Modal visible={!!selectedUpload} transparent animationType="none" onRequestClose={closeDetail}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeDetail} />
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            {selectedUpload && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalDate}>{formatDate(selectedUpload.date)}</Text>
                    <Text style={styles.modalSub}>By: {selectedUpload.staff_name || 'Staff'}</Text>
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={closeDetail}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Summary Row */}
                <View style={styles.modalSummary}>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatLabel}>Total Revenue</Text>
                    <Text style={styles.modalStatValue}>{formatCurrency(selectedUpload.total_amount)}</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatLabel}>Entries</Text>
                    <Text style={styles.modalStatValue}>{selectedUpload.total_entries}</Text>
                  </View>
                  <View style={[styles.syncBadgeSmall, selectedUpload.is_synced ? styles.syncedBadgeSmall : styles.pendingBadgeSmall]}>
                    <Text style={styles.syncBadgeSmallText}>
                      {selectedUpload.is_synced ? '✓ Synced' : '⏳ Pending'}
                    </Text>
                  </View>
                </View>

                {/* Entries Table Header */}
                <View style={styles.tableHead}>
                  <Text style={[styles.tableHeadText, { flex: 1 }]}>Name</Text>
                  <Text style={[styles.tableHeadText, { width: 90, textAlign: 'right' }]}>Amount</Text>
                  <Text style={[styles.tableHeadText, { width: 50, textAlign: 'center' }]}>Dup</Text>
                </View>

                {/* Entries */}
                {entriesLoading ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
                ) : (
                  <ScrollView style={styles.entriesScroll} showsVerticalScrollIndicator={false}>
                    {entries.length === 0 ? (
                      <Text style={styles.noEntriesText}>No entries recorded for this upload.</Text>
                    ) : (
                      entries.map((entry, i) => (
                        <View key={entry.id} style={[styles.entryRow, i % 2 === 0 && styles.entryRowAlt, entry.is_duplicate && styles.entryRowDup]}>
                          <Text style={styles.entryName} numberOfLines={1}>{entry.name || '—'}</Text>
                          <Text style={[styles.entryAmount, { width: 90, textAlign: 'right' }]}>
                            {entry.amount !== null ? formatCurrency(entry.amount) : '—'}
                          </Text>
                          <Text style={[styles.entryDup, { width: 50, textAlign: 'center' }]}>
                            {entry.is_duplicate ? '⚠' : ''}
                          </Text>
                        </View>
                      ))
                    )}
                    <View style={{ height: 40 }} />
                  </ScrollView>
                )}
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
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
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardRevenue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.revenue },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  syncedDot: { backgroundColor: Colors.primary },
  pendingDot: { backgroundColor: Colors.warning },
  chevron: { fontSize: FontSize.xl, color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl * 2, paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingBottom: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  modalDate: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  modalSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: Colors.textSecondary, fontSize: FontSize.md },
  modalSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.lg,
    backgroundColor: Colors.bgElevated,
  },
  modalStat: { alignItems: 'flex-start' },
  modalStatLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalStatValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.revenue, marginTop: 2 },
  syncBadgeSmall: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 'auto' },
  syncedBadgeSmall: { backgroundColor: 'rgba(0,229,160,0.12)' },
  pendingBadgeSmall: { backgroundColor: 'rgba(251,191,36,0.12)' },
  syncBadgeSmallText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  tableHeadText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  entriesScroll: { flex: 1 },
  entryRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  entryRowAlt: { backgroundColor: 'rgba(255,255,255,0.018)' },
  entryRowDup: { backgroundColor: 'rgba(251,191,36,0.05)' },
  entryName: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '500' },
  entryAmount: { fontSize: FontSize.md, color: Colors.revenue, fontWeight: '700' },
  entryDup: { fontSize: FontSize.sm, color: Colors.warning },
  noEntriesText: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.xl },
});
