import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function StatsScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Statistics</ThemedText>
      <ThemedText>Statistik vanor.</ThemedText>
    </ThemedView>
  );
}
