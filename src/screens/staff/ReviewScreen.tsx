import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';
import { ParsedEntry } from '../../types';
import { parseOcrText, calculateTotal, formatCurrency } from '../../utils/parser';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { addToQueue, syncQueue } from '../../services/offlineQueue';
import { StaffStackParamList } from '../../navigation/StaffStack';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { recognizeText } from 'expo-mlkit-ocr';

type RoutePropType = RouteProp<StaffStackParamList, 'Review'>;
type NavProp = NativeStackNavigationProp<StaffStackParamList, 'Review'>;

export default function ReviewScreen() {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavProp>();
  const { profile } = useAuth();
  const { imageUri } = route.params;

  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [processing, setProcessing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Process OCR
  useEffect(() => {
    const processOcr = async () => {
      setProcessing(true);
      setProcessingError(null);
      try {
        if (route.params.parsedEntries?.length) {
          setEntries(route.params.parsedEntries);
          return;
        }

        const result = await recognizeText(imageUri);
        const parsed = parseOcrText(result.text);
        
        setEntries(parsed);
      } catch (err) {
        console.error('OCR Error:', err);
        setProcessingError('Failed to process image. Please try again.');
      } finally {
        setProcessing(false);
      }
    };
    processOcr();
  }, [imageUri]);

  const updateEntry = useCallback((index: number, field: keyof ParsedEntry, value: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      if (field === 'amount') {
        updated[index] = { ...updated[index], amount: value === '' ? null : parseFloat(value) || null };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  }, []);

  const deleteEntry = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addEntry = useCallback(() => {
    setEntries((prev) => [
      ...prev,
      { original_text: '', name: '', amount: null },
    ]);
  }, []);

  const handleConfirm = async () => {
    const validEntries = entries.filter((e) => e.name.trim());
    if (validEntries.length === 0) {
      Alert.alert('No Entries', 'Please add at least one entry before confirming.');
      return;
    }

    Alert.alert(
      'Confirm Submission',
      `Save ${validEntries.length} entries?\nTotal Revenue: ${formatCurrency(calculateTotal(validEntries))}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => doSave(validEntries) },
      ]
    );
  };

  const doSave = async (validEntries: ParsedEntry[]) => {
    setSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const uploadId = uuidv4();
    const today = new Date().toISOString().split('T')[0];
    const total = calculateTotal(validEntries);

    const upload = {
      id: uploadId,
      date: today,
      staff_id: profile?.id || '',
      total_entries: validEntries.length,
      total_amount: total,
      is_synced: false,
      created_at: new Date().toISOString(),
    };

    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      try {
        const { error: uploadError } = await supabase.from('logbook_uploads').insert(upload);
        if (!uploadError) {
          const rows = validEntries.map((e) => ({
            upload_id: uploadId,
            original_text: e.original_text,
            name: e.name,
            amount: e.amount,
            is_confirmed: true,
            is_duplicate: e.is_duplicate || false,
          }));
          await supabase.from('logbook_entries').insert(rows);
        } else {
          await addToQueue(upload, validEntries);
        }
      } catch {
        await addToQueue(upload, validEntries);
      }
    } else {
      await addToQueue(upload, validEntries);
    }

    setSaving(false);
    navigation.navigate('UploadSuccess', { total, entryCount: validEntries.length });
    // Try to sync any queued items
    syncQueue().catch(() => {});
  };

  const total = calculateTotal(entries);

  const renderEntry = ({ item, index }: { item: ParsedEntry; index: number }) => (
    <View style={[styles.entryRow, item.is_duplicate && styles.duplicateRow]}>
      <View style={styles.entryNumber}>
        <Text style={styles.entryNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.entryFields}>
        <TextInput
          style={styles.nameInput}
          value={item.name}
          onChangeText={(v) => updateEntry(index, 'name', v)}
          placeholder="Name"
          placeholderTextColor={Colors.textMuted}
        />
        <TextInput
          style={[styles.amountInput, item.amount ? styles.amountFilled : {}]}
          value={item.amount !== null ? String(item.amount) : ''}
          onChangeText={(v) => updateEntry(index, 'amount', v)}
          placeholder="—"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
        />
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteEntry(index)}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
      {item.is_duplicate && (
        <View style={styles.duplicateBadge}>
          <Text style={styles.duplicateBadgeText}>DUP</Text>
        </View>
      )}
    </View>
  );

  if (processing) {
    return (
      <LinearGradient colors={['#0A0E1A', '#111827']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingTitle}>Processing Image...</Text>
        <Text style={styles.loadingSubtitle}>Extracting entries from the logbook</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Review Entries</Text>
            <Text style={styles.headerSub}>{entries.length} detected · Tap to edit</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* Thumbnail */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumbnail} resizeMode="cover" />
        ) : null}

        {/* Error */}
        {processingError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {processingError}</Text>
          </View>
        )}

        {/* Column Headers */}
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>#</Text>
          <Text style={[styles.tableHeaderText, { flex: 1, marginLeft: Spacing.sm }]}>Name</Text>
          <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'right' }]}>Amount (₱)</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Entries List */}
        <FlatList
          data={entries}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No entries detected</Text>
              <Text style={styles.emptyText}>Add entries manually below</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.addEntryBtn} onPress={addEntry}>
              <Text style={styles.addEntryText}>+ Add Entry Manually</Text>
            </TouchableOpacity>
          }
        />

        {/* Revenue Summary Bar */}
        <View style={styles.summaryBar}>
          <View>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(total)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={saving}
          >
            <LinearGradient colors={['#00E5A0', '#00B87A']} style={styles.confirmBtnGrad}>
              {saving ? (
                <ActivityIndicator color={Colors.textOnPrimary} />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm & Save</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  loadingSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.xs },
  backBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  thumbnail: { height: 80, marginHorizontal: Spacing.lg, marginTop: Spacing.sm, borderRadius: BorderRadius.md, opacity: 0.7 },
  errorBox: { backgroundColor: 'rgba(248,113,113,0.12)', margin: Spacing.md, padding: Spacing.sm, borderRadius: BorderRadius.md },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  list: { paddingBottom: 20 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
  },
  duplicateRow: { backgroundColor: 'rgba(251,191,36,0.05)' },
  entryNumber: {
    width: 24,
    alignItems: 'center',
  },
  entryNumberText: { fontSize: FontSize.xs, color: Colors.textMuted },
  entryFields: { flex: 1, flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.sm },
  nameInput: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  amountInput: {
    width: 80,
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  amountFilled: { color: Colors.revenue, borderColor: 'rgba(74,222,128,0.3)' },
  deleteBtn: { width: 36, alignItems: 'center', justifyContent: 'center', padding: Spacing.xs },
  deleteBtnText: { color: Colors.danger, fontSize: FontSize.md },
  duplicateBadge: {
    position: 'absolute',
    top: 6,
    right: 42,
    backgroundColor: Colors.warning,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  duplicateBadgeText: { fontSize: 9, fontWeight: '800', color: '#000' },
  addEntryBtn: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addEntryText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
    paddingBottom: 32,
  },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryAmount: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.revenue },
  confirmBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  confirmBtnGrad: { paddingHorizontal: Spacing.xl, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textOnPrimary },
});
