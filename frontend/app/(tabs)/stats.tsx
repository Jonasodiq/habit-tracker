import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStatistics, Statistics } from '@/src/services/statisticsService';

function SummaryCard({ label, value, emoji }: { label: string; value: string | number; emoji: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryEmoji}>{emoji}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// Bar chart Completion
function BarChart({ habits }: { habits: Statistics['habits'] }) {
  const max = Math.max(...habits.map((h) => h.completionRate), 1);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>📊 Completion % (30 dagar)</Text>
      {habits.map((habit) => (
        <View key={habit.habitId} style={styles.barRow}>
          <Text style={styles.barLabel} numberOfLines={1}>{habit.icon} {habit.name}</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(habit.completionRate / max) * 100}%`,
                  backgroundColor: habit.color,
                },
              ]}
            />
          </View>
          <Text style={styles.barValue}>{habit.completionRate}%</Text>
        </View>
      ))}
    </View>
  );
}

// Streaks
function StreakList({ habits }: { habits: Statistics['habits'] }) {
  const sorted = [...habits].sort((a, b) => b.streak - a.streak);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>🔥 Streaks</Text>
      {sorted.map((habit) => (
        <View key={habit.habitId} style={[styles.streakRow, { borderLeftColor: habit.color }]}>
          <Text style={styles.streakIcon}>{habit.icon}</Text>
          <Text style={styles.streakName} numberOfLines={1}>{habit.name}</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakCount}>🔥 {habit.streak}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// Main screen
export default function StatsScreen() {
  const [stats, setStats]       = useState<Statistics | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  async function loadStats() {
    try {
      setLoading(true);
      const data = await getStatistics();
      setStats(data);
    } catch {
      // visa tomt state
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const data = await getStatistics();
      setStats(data);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!stats || stats.summary.totalHabits === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>Ingen statistik än</Text>
        <Text style={styles.emptyText}>Skapa vanor och markera dem som klara för att se statistik!</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Statistik</Text>
      <Text style={styles.subtitle}>Senaste 30 dagarna</Text>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6C63FF"
            colors={['#6C63FF']}
            progressBackgroundColor="#fff"
          />
        }
      >

      {/* Summary cards */}
      <View style={styles.summaryGrid}>
        <SummaryCard emoji="✅" value={stats.summary.completedToday} label="Klara idag" />
        <SummaryCard emoji="📅" value={stats.summary.totalCompletions} label="Totalt" />
        <SummaryCard emoji="🔥" value={stats.summary.bestStreak} label="Bästa streak" />
        <SummaryCard emoji="📈" value={`${stats.summary.avgCompletionRate}%`} label="Snitt %" />
      </View>

      {/* Bar chart */}
      <BarChart habits={stats.habits} />

      {/* Streak list */}
      <StreakList habits={stats.habits} />

    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: '#fff', paddingHorizontal: 32, paddingTop: 60 },
  container:      { flex: 1, backgroundColor: '#fff' },
  content:        { flexGrow: 1, paddingBottom: 16 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title:          { fontSize: 28, fontWeight: '700', color: '#11181C' },
  subtitle:       { fontSize: 14, color: '#687076', marginBottom: 24, marginTop: 4 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyTitle:     { fontSize: 18, fontWeight: '700', color: '#11181C', marginBottom: 8 },
  emptyText:      { fontSize: 14, color: '#687076', textAlign: 'center' },
  

  // Summary
  summaryGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  summaryCard:    { flex: 1, minWidth: '45%', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },
  summaryEmoji:   { fontSize: 28 },
  summaryValue:   { fontSize: 24, fontWeight: '700', color: '#11181C' },
  summaryLabel:   { fontSize: 12, color: '#687076', textAlign: 'center' },

  // Chart
  chartContainer: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: '#11181C', marginBottom: 16 },
  barRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  barLabel:       { width: 100, fontSize: 13, color: '#11181C' },
  barTrack:       { flex: 1, height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 5 },
  barValue:       { width: 36, fontSize: 12, color: '#687076', textAlign: 'right' },

  // Streaks
  streakRow:      { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, borderLeftWidth: 4, gap: 10 },
  streakIcon:     { fontSize: 20 },
  streakName:     { flex: 1, fontSize: 15, fontWeight: '600', color: '#11181C' },
  streakBadge:    { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  streakCount:    { fontSize: 13, fontWeight: '700', color: '#D97706' },
});