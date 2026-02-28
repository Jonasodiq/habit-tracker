import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function StatisticsScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Statistics</ThemedText>
      <ThemedText>Här visas statistik för dina vanor.</ThemedText>
    </ThemedView>
  );
}
