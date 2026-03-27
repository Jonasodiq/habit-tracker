import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Palette, Radius, Spacing, Typography, Shadows } from '@/constants/theme';
import { Statistics } from '@/src/services/statisticsService';
import { Completion } from '@/src/services/completionService';

interface Props {
  visible: boolean;
  habit: Statistics['habits'][0] | null;
  completions: Completion[];
  onClose: () => void;
}

export default function HabitDetailModal({ visible, habit, completions, onClose }: Props) {
  if (!habit) return null;

  // Filter completions for this habit (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const habitCompletions = completions.filter((c) => {
    const date = new Date(c.completedDate + 'T12:00:00');
    return c.habitId === habit.habitId && date >= thirtyDaysAgo;
  });

  // Build 30 day grid
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const dateStr = d.toLocaleDateString('sv-SE');
    const completed = habitCompletions.some((c) => c.completedDate === dateStr);
    return { dateStr, completed, day: d.getDate(), weekday: d.getDay() };
  });

  const completedCount = habitCompletions.length;
  const completionRate = Math.round((completedCount / 30) * 100);

  const colorWithOpacity = habit.color + '22';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconBg, { backgroundColor: colorWithOpacity }]}>
            <Text style={styles.icon}>{habit.icon}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.habitName, { color: habit.color }]}>{habit.name}</Text>
            <Text style={styles.habitFrequency}>
              {habit.frequency === 'daily' ? 'Dagligen' :
               habit.frequency === 'weekly' ? 'Veckovis' : 'Månadsvis'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colorWithOpacity }]}>
              <Text style={[styles.statValue, { color: habit.color }]}>{completedCount}</Text>
              <Text style={styles.statLabel}>Genomförda</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colorWithOpacity }]}>
              <Text style={[styles.statValue, { color: habit.color }]}>{completionRate}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colorWithOpacity }]}>
              <Text style={[styles.statValue, { color: habit.color }]}>🔥 {habit.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>

          {/* 30-day grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Senaste 30 dagarna</Text>
            <View style={styles.grid}>
              {days.map((day, index) => (
                <View
                  key={index}
                  style={[
                    styles.gridDay,
                    day.completed
                      ? { backgroundColor: habit.color }
                      : { backgroundColor: Palette.gray100 },
                  ]}
                >
                  <Text style={[
                    styles.gridDayText,
                    day.completed ? { color: Palette.white } : { color: Palette.gray400 },
                  ]}>
                    {day.day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: habit.color }]} />
              <Text style={styles.legendText}>Genomförd</Text>
              <View style={[styles.legendDot, { backgroundColor: Palette.gray200 }]} />
              <Text style={styles.legendText}>Missad</Text>
            </View>
          </View>

          {/* Latest implementations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Senaste genomföranden</Text>
            {habitCompletions.length === 0 ? (
              <Text style={styles.emptyText}>Inga genomföranden ännu</Text>
            ) : (
              [...habitCompletions]
                .sort((a, b) => b.completedDate.localeCompare(a.completedDate))
                .slice(0, 10)
                .map((c) => (
                  <View key={c.completionId} style={styles.completionRow}>
                    <View style={[styles.completionDot, { backgroundColor: habit.color }]} />
                    <Text style={styles.completionDate}>
                      {new Date(c.completedDate + 'T12:00:00').toLocaleDateString('sv-SE', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                    </Text>
                    <Text style={styles.completionCheck}>✅</Text>
                  </View>
                ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Palette.white },
  header:         { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Palette.gray100, gap: Spacing.md },
  iconBg:         { width: 52, height: 52, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },
  icon:           { fontSize: 28 },
  headerInfo:     { flex: 1 },
  habitName:      { fontSize: Typography.xl, fontWeight: Typography.bold },
  habitFrequency: { fontSize: Typography.sm, color: Palette.gray400, marginTop: 2 },
  closeBtn:       { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Palette.gray100, justifyContent: 'center', alignItems: 'center' },
  closeText:      { fontSize: Typography.md, color: Palette.gray600 },
  content:        { padding: Spacing.xl, gap: Spacing.lg },

  // Stats
  statsRow:       { flexDirection: 'row', gap: Spacing.md },
  statCard:       { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs },
  statValue:      { fontSize: Typography.xl, fontWeight: Typography.extrabold },
  statLabel:      { fontSize: Typography.xs, color: Palette.gray500 },

  // Section
  section:        { backgroundColor: Palette.gray50, borderRadius: Radius.lg, padding: Spacing.lg },
  sectionTitle:   { fontSize: Typography.md, fontWeight: Typography.bold, color: Palette.gray900, marginBottom: Spacing.md },

  // Grid
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridDay:        { width: 36, height: 36, borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center' },
  gridDayText:    { fontSize: Typography.xs, fontWeight: Typography.semibold },
  legend:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  legendDot:      { width: 12, height: 12, borderRadius: Radius.full },
  legendText:     { fontSize: Typography.xs, color: Palette.gray500, marginRight: Spacing.sm },

  // Completions
  completionRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Palette.gray100, gap: Spacing.md },
  completionDot:  { width: 8, height: 8, borderRadius: Radius.full },
  completionDate: { flex: 1, fontSize: Typography.sm, color: Palette.gray600, textTransform: 'capitalize' },
  completionCheck:{ fontSize: Typography.md },
  emptyText:      { fontSize: Typography.sm, color: Palette.gray400, textAlign: 'center', paddingVertical: Spacing.md },
});