import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getHabits, deleteHabit, Habit } from '@/src/services/habitService';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
  }, []);

  async function fetchHabits() {
    try {
      setLoading(true);
      const data = await getHabits();
      setHabits(data);
    } catch (err) {
      Alert.alert('Fel', 'Kunde inte hämta vanor');
    } finally {
      setLoading(false);
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
      <Text style={styles.title}>Mina vanor</Text>

      {habits.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Inga vanor ännu — lägg till en!</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(h) => h.habitId}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderLeftColor: item.color }]}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                {!!item.description && (
                  <Text style={styles.description}>{item.description}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.habitId)}>
                <Text style={styles.delete}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: '#11181C',
  },
  empty: {
    color: '#687076',
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  description: {
    fontSize: 13,
    color: '#687076',
    marginTop: 2,
  },
  delete: {
    fontSize: 20,
    paddingLeft: 8,
  },
});
