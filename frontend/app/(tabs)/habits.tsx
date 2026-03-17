import { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { deleteHabit } from '@/src/services/habitService';
import { completeHabit, deleteCompletion } from '@/src/services/completionService';
import { useHabits } from '@/src/contexts/HabitsContext';
import HabitList from '@/components/HabitList';
import { Palette, Spacing, Typography } from '@/constants/theme';
import * as Progress from 'react-native-progress'; // https://www.npmjs.com/package/react-native-progress?activeTab=readme

export default function HabitsScreen() {
  const {
  habits,
  completions,
  loading,
  refreshing,
  loadAll,
  refresh,
  setHabits,
  setCompletions,
} = useHabits();

useFocusEffect(
  useCallback(() => {
    loadAll();
  }, [])
);

 async function handleComplete(habitId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const existingCompletion = completions.find(
    (c) => c.habitId === habitId && c.completedDate === today
  );
  try {
    if (existingCompletion) {
      await deleteCompletion(existingCompletion.completionId);
      setCompletions(completions.filter((c) => c.completionId !== existingCompletion.completionId));
      setHabits(habits.map((h) =>
        h.habitId === habitId ? { ...h, streak: Math.max((h.streak ?? 0) - 1, 0) } : h
      ));
    } else {
      const result = await completeHabit(habitId);
      setCompletions([...completions, result]);
      setHabits(habits.map((h) =>
        h.habitId === habitId ? { ...h, streak: (h.streak ?? 0) + 1 } : h
      ));
    }
  } catch {
    Alert.alert('Fel', 'Kunde inte uppdatera vanan');
  }
}

async function handleDelete(habitId: string) {
  Alert.alert('Ta bort vana', 'Är du säker?', [
    { text: 'Avbryt', style: 'cancel' },
    {
      text: 'Ta bort',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteHabit(habitId);
          setHabits(habits.filter((h) => h.habitId !== habitId));
        } catch {
          Alert.alert('Fel', 'Kunde inte ta bort vanan');
        }
      },
    },
  ]);
}

  const today = new Date().toISOString().slice(0, 10);
  const completedToday = new Set(
    completions.filter((c) => c.completedDate === today).map((c) => c.habitId)
  );

  // Today's date in Swedish
  const dateStr = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const completedCount = completedToday.size;
  const totalCount = habits.length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.title}>Mina vanor</Text>
        </View>
        {totalCount > 0 && (
          <View>
            <Text> {completedCount}/{totalCount} </Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      {totalCount > 0 && (
        <Progress.Bar
          progress={completedCount / totalCount}
          width={null}
          height={8}
          color={Palette.primary}
          unfilledColor={Palette.gray200}
          borderWidth={0}
          borderRadius={99}
          animated={true}
          style={styles.progressBar}
        />
      )}

      <HabitList
        habits={habits}
        completedToday={completedToday}
        refreshing={refreshing}
        onRefresh={refresh}
        onComplete={handleComplete}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, paddingTop: 60, backgroundColor: Palette.gray100 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  date:        { fontSize: Typography.sm, color: Palette.gray400, textTransform: 'capitalize', marginBottom: 2 },
  title:       { fontSize: Typography.xxxl, fontWeight: Typography.extrabold, color: Palette.gray900 },
  progressBar: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl },
});