import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getHabits, deleteHabit, Habit } from '@/src/services/habitService';
import { getCompletions, completeHabit, deleteCompletion, Completion } from '@/src/services/completionService';
import HabitList from '@/components/HabitList';

export default function HabitsScreen() {
  const [habits, setHabits]         = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  async function loadAll() {
    try {
      setLoading(true);
      const [habitsData, completionsData] = await Promise.all([
        getHabits(),
        getCompletions(),
      ]);
      setHabits(habitsData);
      setCompletions(completionsData);
    } catch {
      Alert.alert('Fel', 'Kunde inte hämta vanor');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const [habitsData, completionsData] = await Promise.all([
        getHabits(),
        getCompletions(),
      ]);
      setHabits(habitsData);
      setCompletions(completionsData);
    } catch {
      Alert.alert('Fel', 'Kunde inte uppdatera');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleComplete(habitId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const existingCompletion = completions.find(
    (c) => c.habitId === habitId && c.completedDate === today
  );

  // console.log('habitId:', habitId);
  // console.log('today:', today);
  // console.log('existingCompletion:', existingCompletion);
  // console.log('completions:', completions);

  try {
    if (existingCompletion) {
      // Avmarkera
      await deleteCompletion(existingCompletion.completionId);
      setCompletions((prev) => prev.filter((c) => c.completionId !== existingCompletion.completionId));
      setHabits((prev) =>
        prev.map((h) =>
          h.habitId === habitId ? { ...h, streak: Math.max((h.streak ?? 0) - 1, 0) } : h
        )
      );
    } else {
      // Markera
      const result = await completeHabit(habitId);
      setCompletions((prev) => [...prev, result]);
      setHabits((prev) =>
        prev.map((h) =>
          h.habitId === habitId ? { ...h, streak: (h.streak ?? 0) + 1 } : h
        )
      );
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
            setHabits((prev) => prev.filter((h) => h.habitId !== habitId));
          } catch {
            Alert.alert('Fel', 'Kunde inte ta bort vanan');
          }
        },
      },
    ]);
  }

  // Bygg set av habitIds genomförda idag
  const today = new Date().toISOString().slice(0, 10);
  const completedToday = new Set(
    completions
      .filter((c) => c.completedDate === today)
      .map((c) => c.habitId)
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mina vanor</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/habit-form' as any)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <HabitList
        habits={habits}
        completedToday={completedToday}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onComplete={handleComplete}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:         { fontSize: 28, fontWeight: '700', color: '#11181C' },
  addButton:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});