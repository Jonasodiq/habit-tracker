import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

interface Props {
  aiInsight: string | null;
  fallbackInsights: { id: string; type: string; message: string }[];
  generatedAt: string;
  dataPoints: number;
  fromCache: boolean;
}

// Parsar text med **bold** markdown
function parseInsightText(text: string) {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  return lines.map((line, lineIndex) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const hasBold = parts.some((_, i) => i % 2 === 1);
    const isFirst = lineIndex === 0;

    return (
      <View key={lineIndex}>
        <Text style={styles.aiText}>
          {parts.map((part, i) =>
            i % 2 === 1
              ? <Text key={i} style={styles.aiBold}>{part}</Text>
              : <Text key={i}>{part}</Text>
          )}
        </Text>
        {hasBold && isFirst && <View style={styles.separator} />}
      </View>
    );
  });
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

      {/* AI insikt */}
      {aiInsight && (
        <Animated.View style={[styles.aiCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {parseInsightText(aiInsight)}
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
  container:    { backgroundColor: Palette.gray50, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title:        { fontSize: Typography.md, fontWeight: Typography.bold, color: Palette.gray900 },
  meta:         { fontSize: Typography.xs, color: Palette.gray400 },
  aiCard:       { backgroundColor: Palette.primaryLight, borderWidth: 3, borderColor: Palette.primary + '55', borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.sm },
  aiText:       { fontSize: Typography.base, color: Palette.gray900, lineHeight: 22 },
  aiBold:       { fontWeight: Typography.bold, color: Palette.gray900 },
  separator:    { height: 1, backgroundColor: Palette.primary + '55', marginVertical: Spacing.sm },
  fallbackCard: { backgroundColor: Palette.gray50, borderWidth: 1, borderColor: Palette.gray200, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  fallbackText: { fontSize: Typography.base, color: Palette.gray900, lineHeight: 20 },
  empty:        { alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm },
  emptyIcon:    { fontSize: 32 },
  emptyText:    { fontSize: Typography.sm, color: Palette.gray500, textAlign: 'center', lineHeight: 18 },
  generatedAt:  { fontSize: Typography.xs, color: Palette.gray400, textAlign: 'right', marginTop: Spacing.xs },
});