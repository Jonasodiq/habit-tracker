import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getStatistics, Statistics } from '@/src/services/statisticsService';
import { useHabits } from '@/src/contexts/HabitsContext';
import HabitCalendar from '@/components/HabitCalendar';
import { Palette, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import HabitDetailModal from '@/components/HabitDetailModal';

function SummaryCard({ label, value, emoji, color }: {
  label: string;
  value: string | number;
  emoji: string;
  color: string;
}) {
  return (
    <View style={[styles.summaryCard, Shadows.sm]}>
      <View style={[styles.summaryIconBg, { backgroundColor: color + '22' }]}>
        <Text style={styles.summaryEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function BarChart({ habits }: { habits: Statistics['habits'] }) {
  const max = Math.max(...habits.map((h) => h.completionRate), 1);

  return (
    <View style={[styles.section, Shadows.sm]}>
      <Text style={styles.sectionTitle}>📊 Completion %</Text>
      <Text style={styles.sectionSubtitle}>Senaste 30 dagarna</Text>
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

function StreakList({ habits, onPress }: {
  habits: Statistics['habits'];
  onPress: (habit: Statistics['habits'][0]) => void;
}) {
  const sorted = [...habits].sort((a, b) => b.streak - a.streak);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔥 Streaks</Text>
      {sorted.length === 0 ? (
        <Text style={styles.noStreaks}>Inga streaks ännu</Text>
      ) : (
        sorted.map((habit) => (
          <TouchableOpacity
            key={habit.habitId}
            style={[styles.streakRow, { borderLeftColor: habit.color }]}
            onPress={() => onPress(habit)}
            activeOpacity={0.7}
          >
            <Text style={styles.streakIcon}>{habit.icon}</Text>
            <Text style={styles.streakName} numberOfLines={1}>{habit.name}</Text>
            <View style={[styles.streakBadge, { backgroundColor: habit.color + '22' }]}>
              <Text style={[styles.streakCount, { color: habit.color }]}>🔥 {habit.streak}</Text>
            </View>
            <Text style={styles.streakArrow}>›</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

export default function StatsScreen() {
  const [stats, setStats]             = useState<Statistics | null>(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const { habits, completions, loadAll, refresh: refreshHabits } = useHabits();
  const [selectedHabit, setSelectedHabit] = useState<Statistics['habits'][0] | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  async function loadStats() {
    try {
      setLoading(true);
      await Promise.all([
        getStatistics(),
        loadAll(),
      ]).then(([data]) => {
        setStats(data);
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const [data] = await Promise.all([
        getStatistics(),
        refreshHabits(),
      ]);
      setStats(data);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Palette.primary} />
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Statistik</Text>
          <Text style={styles.subtitle}>Senaste 30 dagarna</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Palette.primary}
            colors={[Palette.primary]}
          />
        }
      >
        {/* Summary cards */}
        <View style={styles.summaryGrid}>
          <SummaryCard emoji="✅" value={stats.summary.completedToday}          label="Klara idag"   color={Palette.success} />
          <SummaryCard emoji="📅" value={stats.summary.totalCompletions}        label="Totalt"       color={Palette.primary} />
          <SummaryCard emoji="🔥" value={stats.summary.bestStreak}              label="Bästa streak" color={Palette.streak} />
          <SummaryCard emoji="📈" value={`${stats.summary.avgCompletionRate}%`} label="Snitt %"      color={Palette.secondary} />
        </View>

        {/* Kalender */}
        <HabitCalendar habits={habits} completions={completions} />

        {/* Bar chart */}
        <BarChart habits={stats.habits} />

        {/* Streak list */}
        <StreakList habits={stats.habits} onPress={setSelectedHabit} />

        <HabitDetailModal
          visible={!!selectedHabit}
          habit={selectedHabit}
          completions={completions}
          onClose={() => setSelectedHabit(null)}
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: Palette.gray50 },
  container:      { flex: 1 },
  content:        { padding: Spacing.xl, paddingBottom: 100 },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxxl },
  header:         { paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg, backgroundColor: Palette.white },
  title:          { fontSize: Typography.xxxl, fontWeight: Typography.extrabold, color: Palette.gray900 },
  subtitle:       { fontSize: Typography.sm, color: Palette.gray400, marginTop: 2 },
  emptyIcon:      { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle:     { fontSize: Typography.xl, fontWeight: Typography.bold, color: Palette.gray900, marginBottom: Spacing.sm },
  emptyText:      { fontSize: Typography.base, color: Palette.gray500, textAlign: 'center' },

  // Summary
  summaryGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  summaryCard:    { flex: 1, minWidth: '45%', backgroundColor: Palette.white, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs },
  summaryIconBg:  { width: 64, height: 64, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  summaryEmoji:   { fontSize: 24 },
  summaryValue:   { fontSize: Typography.xxl, fontWeight: Typography.extrabold, color: Palette.gray900 },
  summaryLabel:   { fontSize: Typography.xs, color: Palette.gray500, textAlign: 'center' },

  // Sections
  section:        { backgroundColor: Palette.white, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle:   { fontSize: Typography.lg, fontWeight: Typography.bold, color: Palette.gray900, marginBottom: 24 },
  sectionSubtitle:{ fontSize: Typography.xs, color: Palette.gray400, marginBottom: Spacing.lg, marginTop: 2 },

  // Bar chart
  barRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  barLabel:       { width: 100, fontSize: Typography.sm, color: Palette.gray900 },
  barTrack:       { flex: 1, height: 10, backgroundColor: Palette.gray100, borderRadius: Radius.full, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: Radius.full },
  barValue:       { width: 36, fontSize: Typography.xs, color: Palette.gray500, textAlign: 'right' },

  // Streaks
  streakRow:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Palette.gray50, borderRadius: Radius.sm, marginBottom: Spacing.sm, borderLeftWidth: 3, gap: Spacing.md },
  streakIcon:     { fontSize: Typography.xl },
  streakName:     { flex: 1, fontSize: Typography.base, fontWeight: Typography.semibold, color: Palette.gray900 },
  streakBadge:    { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  streakCount:    { fontSize: Typography.sm, fontWeight: Typography.bold },
  streakArrow:    { fontSize: Typography.xl, color: Palette.gray300, paddingRight: Spacing.md },
  noStreaks:      { fontSize: Typography.sm, color: Palette.gray400, textAlign: 'center', paddingVertical: Spacing.md },
});