import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';

interface Props {
  aiInsight: string | null;
  fallbackInsights: { id: string; type: string; message: string }[];
  generatedAt: string;
  dataPoints: number;
  fromCache: boolean;
}

export default function InsightCards({ aiInsight, fallbackInsights, generatedAt, dataPoints, fromCache }: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [aiInsight]);

  if (!aiInsight && fallbackInsights.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🤖 AI-insikter</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>
            Fortsätt markera dina vanor! Insikter genereras efter 7 dagars data.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI-insikter</Text>
        <Text style={styles.meta}>{fromCache ? '💾 cachad' : `${dataPoints} datapunkter`}</Text>
      </View>

      {/* Claude AI insikt */}
      {aiInsight && (
        <Animated.View style={[styles.aiCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.aiText}>{aiInsight}</Text>
        </Animated.View>
      )}

      {/* Fallback insikter */}
      {fallbackInsights.map((insight) => (
        <View key={insight.id} style={styles.fallbackCard}>
          <Text style={styles.fallbackText}>{insight.message}</Text>
        </View>
      ))}

      <Text style={styles.generatedAt}>
        {new Date(generatedAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginBottom: 16 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:        { fontSize: 16, fontWeight: '700', color: '#11181C' },
  meta:         { fontSize: 12, color: '#9CA3AF' },
  aiCard:       { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 12, padding: 16, marginBottom: 10 },
  aiText:       { fontSize: 14, color: '#11181C', lineHeight: 22 },
  fallbackCard: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 10 },
  fallbackText: { fontSize: 14, color: '#11181C', lineHeight: 20 },
  empty:        { alignItems: 'center', padding: 16, gap: 8 },
  emptyIcon:    { fontSize: 32 },
  emptyText:    { fontSize: 13, color: '#687076', textAlign: 'center', lineHeight: 18 },
  generatedAt:  { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
});