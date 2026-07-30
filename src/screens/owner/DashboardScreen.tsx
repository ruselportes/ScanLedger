import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useAuth } from '../../context/AuthContext';
import { fetchRevenueStats } from '../../services/dataService';
import { RevenueStats } from '../../types';
import { formatCurrency } from '../../utils/parser';
import { Colors, Spacing, FontSize, BorderRadius } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatCard {
  label: string;
  value: number;
  period: string;
  color: string;
}

export default function DashboardScreen() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchRevenueStats();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const statCards: StatCard[] = stats
    ? [
        { label: 'Today', value: stats.daily, period: 'Daily Revenue', color: '#00E5A0' },
        { label: 'This Week', value: stats.weekly, period: 'Weekly Revenue', color: '#8B5CF6' },
        { label: 'This Month', value: stats.monthly, period: 'Monthly Revenue', color: '#FF6B35' },
        { label: 'This Year', value: stats.yearly, period: 'Yearly Revenue', color: '#FBBF24' },
      ]
    : [];

  const chartLabels = stats?.daily_history?.slice(-7).map((d) => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }) || ['—'];

  const chartData = stats?.daily_history?.slice(-7).map((d) => d.total) || [0];

  return (
    <LinearGradient colors={['#0A0E1A', '#111827']} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.ownerName}>{profile?.full_name || 'Owner'}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>
              {new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
        ) : (
          <>
            {/* Revenue Cards Grid */}
            <View style={styles.cardsGrid}>
              {statCards.map((card) => (
                <View key={card.period} style={styles.statCard}>
                  <View style={[styles.statCardAccent, { backgroundColor: card.color }]} />
                  <Text style={styles.statPeriod}>{card.label}</Text>
                  <Text style={[styles.statValue, { color: card.color }]}>
                    {formatCurrency(card.value)}
                  </Text>
                  <Text style={styles.statLabel}>{card.period}</Text>
                </View>
              ))}
            </View>

            {/* Line Chart */}
            {chartData.some((v) => v > 0) && (
              <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Last 7 Days Revenue</Text>
                <LineChart
                  data={{
                    labels: chartLabels,
                    datasets: [{ data: chartData, color: () => '#00E5A0', strokeWidth: 2.5 }],
                  }}
                  width={SCREEN_WIDTH - Spacing.lg * 2}
                  height={200}
                  chartConfig={{
                    backgroundColor: Colors.bgCard,
                    backgroundGradientFrom: Colors.bgCard,
                    backgroundGradientTo: Colors.bgElevated,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0,229,160,${opacity})`,
                    labelColor: () => Colors.textMuted,
                    propsForDots: { r: '5', strokeWidth: '2', stroke: '#00E5A0' },
                    propsForBackgroundLines: { stroke: Colors.border, strokeWidth: 1 },
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            )}

            {/* Today's Summary */}
            <View style={styles.todaySummary}>
              <Text style={styles.sectionTitle}>Today's Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
                <Text style={styles.summaryRevenue}>{formatCurrency(stats?.daily || 0)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Processed Entries</Text>
                <Text style={styles.summaryCount}>
                  {stats?.daily_history?.find(
                    (d) => d.date === new Date().toISOString().split('T')[0]
                  )?.entry_count || 0}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  greeting: { fontSize: FontSize.md, color: Colors.textSecondary },
  ownerName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  dateBadge: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  dateBadgeText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  statCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  statPeriod: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  chartContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  chart: { borderRadius: BorderRadius.md },
  todaySummary: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryRevenue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.revenue },
  summaryCount: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
});
