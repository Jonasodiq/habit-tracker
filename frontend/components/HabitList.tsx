import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Habit } from '@/src/services/habitService';

interface Props {
  habits: Habit[];
  refreshing: boolean;
  onRefresh: () => void;
  onDelete: (habitId: string) => void;
}

export default function HabitList({ habits, refreshing, onRefresh, onDelete }: Props) {
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
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6C63FF"
          colors={['#6C63FF']}
        />
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { borderLeftColor: item.color }]}>
          <Text style={styles.icon}>{item.icon}</Text>
          <View style={styles.cardContent}>
            <Text style={styles.name}>{item.name}</Text>
            {!!item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}
            <Text style={styles.frequency}>
              {item.frequency === 'daily' ? '📅 Dagligen' : item.frequency === 'weekly' ? '📅 Veckovis' : '📅 Månadsvis'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onDelete(item.habitId)}>
            <Text style={styles.delete}>🗑</Text>
          </TouchableOpacity>
        </View>
      )}
      contentContainerStyle={habits.length === 0 ? styles.fullHeight : styles.list}
    />
  );
}

const styles = StyleSheet.create({
  fullHeight:   { flex: 1 },
  list:         { paddingBottom: 32 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon:    { fontSize: 48, marginBottom: 8 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#11181C' },
  emptyText:    { fontSize: 14, color: '#687076', textAlign: 'center', paddingHorizontal: 32 },
  card:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  icon:         { fontSize: 24, marginRight: 12 },
  cardContent:  { flex: 1, gap: 2 },
  name:         { fontSize: 16, fontWeight: '600', color: '#11181C' },
  description:  { fontSize: 13, color: '#687076' },
  frequency:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  delete:       { fontSize: 20, paddingLeft: 8 },
});