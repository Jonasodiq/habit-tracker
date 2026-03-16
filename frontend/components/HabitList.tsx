import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Habit } from '@/src/services/habitService';
import { Palette, Radius, Spacing, Typography, Shadows } from '@/constants/theme';

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
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.25, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onComplete(item.habitId);
  }

  const frequencyLabel =
    item.frequency === 'daily'   ? 'Dagligen' :
    item.frequency === 'weekly'  ? 'Veckovis' : 'Månadsvis';

  // Transparent color for completed
  const colorWithOpacity = item.color + '22';

  return (
    <View style={[styles.card, isCompleted && styles.cardDone, Shadows.sm]}>
      {/* Colored left edge */}
      <View style={[styles.colorBar, { backgroundColor: item.color }]} />

      {/* Checkbox */}
      <TouchableOpacity onPress={handleComplete} style={styles.checkboxWrapper} activeOpacity={0.7}>
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

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.name, isCompleted && styles.nameCompleted]}>
          {item.icon} {item.name}
        </Text>
        {!!item.description && (
          <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
        )}
        <View style={styles.meta}>
          <View style={[styles.frequencyBadge, { backgroundColor: colorWithOpacity }]}>
            <Text style={[styles.frequencyText, { color: item.color }]}>{frequencyLabel}</Text>
          </View>
          {(item.streak ?? 0) > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {item.streak}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Edit and delete */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push({
            pathname: '/(tabs)/habit-form' as any,
            params: {
              habitId:     item.habitId,
              name:        item.name,
              description: item.description,
              frequency:   item.frequency,
              color:       item.color,
              icon:        item.icon,
            },
          })}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item.habitId)}>
          <Text style={styles.actionIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HabitList({ habits, completedToday, refreshing, onRefresh, onComplete, onDelete }: Props) {
  const [hideCompleted, setHideCompleted] = useState(false);

  const filteredHabits = hideCompleted
    ? habits.filter((h) => !completedToday.has(h.habitId))
    : habits;

  const completedCount = habits.filter((h) => completedToday.has(h.habitId)).length;

  if (habits.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🌱</Text>
        <Text style={styles.emptyTitle}>Inga vanor ännu</Text>
        <Text style={styles.emptyText}>Tryck på + för att lägga till din första vana!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredHabits}
      keyExtractor={(h) => h.habitId}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Palette.primary}
          colors={[Palette.primary]}
        />
      }
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <TouchableOpacity
            style={[styles.toggleBtn, hideCompleted && styles.toggleBtnActive]}
            onPress={() => setHideCompleted(!hideCompleted)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, hideCompleted && styles.toggleTextActive]}>
            {hideCompleted
              ? `Visa ✅ (${completedCount})`
              : `Göm ✅ (${completedCount})`}
          </Text>
          </TouchableOpacity>
        </View>
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
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list:            { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  empty:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, paddingTop: 80 },
  emptyIcon:       { fontSize: 56, marginBottom: Spacing.sm },
  emptyTitle:      { fontSize: Typography.xl, fontWeight: Typography.bold, color: Palette.gray900 },
  emptyText:       { fontSize: Typography.base, color: Palette.gray500, textAlign: 'center', paddingHorizontal: Spacing.xxxl },
  listHeader:      { marginBottom: Spacing.md },
  toggleBtn:       { alignSelf: 'flex-end', backgroundColor: Palette.gray100, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  toggleBtnActive: { backgroundColor: Palette.primaryLight },
  toggleText:      { fontSize: Typography.sm, color: Palette.gray500, fontWeight: Typography.medium },
  toggleTextActive:{ color: Palette.primary },
  card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.white, borderRadius: Radius.lg, marginBottom: Spacing.md, overflow: 'hidden' },
  cardDone:        { opacity: 0.55 },
  colorBar:        { width: 5, alignSelf: 'stretch' },
  checkboxWrapper: { padding: Spacing.sm },
  checkbox:        { width: 40, height: 40, borderRadius: Radius.full, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkmark:       { color: Palette.white, fontSize: Typography.md, fontWeight: Typography.bold },
  cardContent:     { flex: 1, gap: 3, paddingVertical: Spacing.md },
  name:            { fontSize: Typography.md, fontWeight: Typography.semibold, color: Palette.gray900 },
  nameCompleted:   { textDecorationLine: 'line-through', color: Palette.gray400 },
  description:     { fontSize: Typography.sm, color: Palette.gray500 },
  meta:            { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  frequencyBadge:  { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  frequencyText:   { fontSize: Typography.xs, fontWeight: Typography.medium },
  streakBadge:     { backgroundColor: Palette.streakLight, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  streakText:      { fontSize: Typography.xs, color: Palette.streak, fontWeight: Typography.medium },
  actions:         { flexDirection: 'row', gap: Spacing.xs, paddingRight: Spacing.md },
  actionBtn:       { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  actionIcon:      { fontSize: Typography.lg },
});