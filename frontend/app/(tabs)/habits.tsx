import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getHabits, deleteHabit, Habit } from '@/src/services/habitService';
import HabitList from '@/components/HabitList';

export default function HabitsScreen() {
  const [habits, setHabits]       = useState<Habit[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  async function loadHabits() {
    try {
      setLoading(true);
      const data = await getHabits();
      setHabits(data);
    } catch {
      Alert.alert('Fel', 'Kunde inte hämta vanor');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const data = await getHabits();
      setHabits(data);
    } catch {
      Alert.alert('Fel', 'Kunde inte uppdatera vanor');
    } finally {
      setRefreshing(false);
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
        refreshing={refreshing}
        onRefresh={handleRefresh}
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