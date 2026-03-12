import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRef } from 'react';
import { router } from 'expo-router';
import { Habit } from '@/src/services/habitService';

interface Props {
  habits: Habit[];
  completedToday: Set<string>;
  refreshing: boolean;
  onRefresh: () => void;
  onComplete: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}

function HabitCard({ item, isCompleted, onComplete, onDelete }: {
  item: Habit;
  isCompleted: boolean;
  onComplete: (habitId: string) => void;
  onDelete: (habitId: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function handleComplete() {
    // Bounce animation
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onComplete(item.habitId);
  }

  return (
    <View style={[styles.card, { borderLeftColor: item.color }, isCompleted && styles.cardDone]}>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={handleComplete}
        style={styles.checkboxWrapper}
      >
        <Animated.View
          style={[
            styles.checkbox,
            { borderColor: item.color },
            isCompleted && { backgroundColor: item.color },
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </Animated.View>
      </TouchableOpacity>

      {/* Innehåll */}
      <View style={styles.cardContent}>
        <Text style={[styles.name, isCompleted && styles.nameCompleted]}>
          {item.icon} {item.name}
        </Text>
        {!!item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
        <View style={styles.meta}>
          <Text style={styles.frequency}>
            {item.frequency === 'daily' ? '📅 Dagligen' : item.frequency === 'weekly' ? '📅 Veckovis' : '📅 Månadsvis'}
          </Text>
          {(item.streak ?? 0) > 0 && (
            <Text style={styles.streak}>🔥 {item.streak}</Text>
          )}
        </View>
      </View>

      {/* Åtgärder */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/(tabs)/habit-form' as any,
            params: {
              habitId: item.habitId,
              name: item.name,
              description: item.description,
              frequency: item.frequency,
              color: item.color,
              icon: item.icon,
            },
          })}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.habitId)}>
          <Text style={styles.actionIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HabitList({ habits, completedToday, refreshing, onRefresh, onComplete, onDelete }: Props) {
  if (habits.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🌱</Text>
        <Text style={styles.emptyTitle}>Inga vanor ännu</Text>
        <Text style={styles.emptyText}>Tryck på + för att lägga till din första vana!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={habits}
      keyExtractor={(h) => h.habitId}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" colors={['#6C63FF']} />
      }
      renderItem={({ item }) => (
        <HabitCard
          item={item}
          isCompleted={completedToday.has(item.habitId)}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list:            { paddingBottom: 32 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon:       { fontSize: 48, marginBottom: 8 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: '#11181C' },
  emptyText:       { fontSize: 14, color: '#687076', textAlign: 'center', paddingHorizontal: 32 },
  card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, gap: 12 },
  cardDone:        { opacity: 0.6 },
  checkboxWrapper: { padding: 4 },
  checkbox:        { width: 42, height: 42, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkmark:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardContent:     { flex: 1, gap: 2 },
  name:            { fontSize: 16, fontWeight: '600', color: '#11181C' },
  nameCompleted:   { textDecorationLine: 'line-through', color: '#687076' },
  description:     { fontSize: 13, color: '#687076' },
  meta:            { flexDirection: 'row', gap: 12, marginTop: 4 },
  frequency:       { fontSize: 12, color: '#9CA3AF' },
  streak:          { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  actions:         { gap: 8 },
  actionIcon:      { fontSize: 18, paddingLeft: 4 },
});